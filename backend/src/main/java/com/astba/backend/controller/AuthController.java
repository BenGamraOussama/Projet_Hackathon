package com.astba.backend.controller;

import com.astba.backend.dto.ForgotPasswordRequest;
import com.astba.backend.dto.JwtAuthenticationResponse;
import com.astba.backend.dto.LoginRequest;
import com.astba.backend.dto.ResetPasswordRequest;
import com.astba.backend.dto.UserResponse;
import com.astba.backend.entity.PasswordResetToken;
import com.astba.backend.entity.RefreshToken;
import com.astba.backend.entity.User;
import com.astba.backend.repository.UserRepository;
import com.astba.backend.security.JwtTokenProvider;
import com.astba.backend.security.LoginRateLimiter;
import com.astba.backend.service.AuthTokenService;
import com.astba.backend.service.EmailService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;
import jakarta.servlet.http.Cookie;

import jakarta.servlet.http.HttpServletRequest;
import java.time.Duration;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;
    private final AuthTokenService authTokenService;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final LoginRateLimiter loginRateLimiter;

    @Value("${app.security.refresh-cookie-name:astba_refresh}")
    private String refreshCookieName;

    @Value("${app.security.refresh-cookie-secure:false}")
    private boolean refreshCookieSecure;

    @Value("${app.security.refresh-cookie-same-site:Strict}")
    private String refreshCookieSameSite;

    @Value("${app.security.frontend-base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    @Value("${jwt.refresh-expiration:1209600000}")
    private long refreshTokenExpirationMs;

    public AuthController(AuthenticationManager authenticationManager, JwtTokenProvider tokenProvider,
            UserRepository userRepository,
            AuthTokenService authTokenService,
            EmailService emailService,
            PasswordEncoder passwordEncoder,
            LoginRateLimiter loginRateLimiter) {
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
        this.userRepository = userRepository;
        this.authTokenService = authTokenService;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;
        this.loginRateLimiter = loginRateLimiter;
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest, HttpServletRequest request) {
        String clientKey = extractClientKey(request);
        if (loginRateLimiter.isBlocked(clientKey)) {
            return ResponseEntity.status(429).body("Too many login attempts. Please try again later.");
        }

        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getEmail(),
                            loginRequest.getPassword()));
        } catch (AuthenticationException ex) {
            loginRateLimiter.recordFailure(clientKey);
            return ResponseEntity.status(401).body("Invalid email or password");
        }

        loginRateLimiter.recordSuccess(clientKey);
        SecurityContextHolder.getContext().setAuthentication(authentication);

        String jwt = tokenProvider.generateToken(authentication);

        User user = userRepository.findByEmail(loginRequest.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String refreshToken = authTokenService.createRefreshToken(user);
        ResponseCookie cookie = buildRefreshCookie(refreshToken);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(new JwtAuthenticationResponse(jwt, new UserResponse(user)));
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(HttpServletRequest request) {
        String refreshToken = extractRefreshToken(request);
        Optional<RefreshToken> token = authTokenService.validateRefreshToken(refreshToken);
        if (token.isEmpty()) {
            return ResponseEntity.status(401).body("Invalid refresh token");
        }

        User user = token.get().getUser();
        String newAccessToken = tokenProvider.generateTokenForUser(user);
        String newRefreshToken = authTokenService.rotateRefreshToken(token.get());
        ResponseCookie cookie = buildRefreshCookie(newRefreshToken);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(new JwtAuthenticationResponse(newAccessToken, new UserResponse(user)));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request) {
        String refreshToken = extractRefreshToken(request);
        if (refreshToken != null && !refreshToken.isBlank()) {
            authTokenService.validateRefreshToken(refreshToken)
                    .ifPresent(authTokenService::revokeRefreshToken);
        }
        ResponseCookie cookie = clearRefreshCookie();
        return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, cookie.toString()).body("Logged out");
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        return userRepository.findByEmail(authentication.getName())
                .<ResponseEntity<?>>map(user -> ResponseEntity.ok(new UserResponse(user)))
                .orElseGet(() -> ResponseEntity.status(404).body("User not found"));
    }

    @PostMapping("/password/forgot")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        if (request == null || request.getEmail() == null || request.getEmail().isBlank()) {
            return ResponseEntity.badRequest().body("Email is required");
        }
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            String token = authTokenService.createPasswordResetToken(user);
            String link = frontendBaseUrl.replaceAll("/$", "") + "/reset-password?token=" + token;
            try {
                emailService.sendPasswordResetEmail(user, link);
            } catch (Exception ex) {
                // Intentionally do not reveal email existence; log in real app
            }
        }
        return ResponseEntity.ok("If the email exists, a reset link has been sent.");
    }

    @PostMapping("/password/reset")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        if (request == null || request.getToken() == null || request.getToken().isBlank()
                || request.getNewPassword() == null || request.getNewPassword().isBlank()) {
            return ResponseEntity.badRequest().body("Token and new password are required");
        }
        Optional<PasswordResetToken> tokenOpt = authTokenService.validatePasswordResetToken(request.getToken());
        if (tokenOpt.isEmpty()) {
            return ResponseEntity.status(401).body("Invalid or expired reset token");
        }

        PasswordResetToken token = tokenOpt.get();
        User user = token.getUser();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        authTokenService.markPasswordResetUsed(token);
        authTokenService.revokeAll(user);

        return ResponseEntity.ok("Password reset successful");
    }

    private ResponseCookie buildRefreshCookie(String refreshToken) {
        long maxAgeSeconds = Duration.ofMillis(refreshTokenExpirationMs).toSeconds();
        return ResponseCookie.from(refreshCookieName, refreshToken)
                .httpOnly(true)
                .secure(refreshCookieSecure)
                .sameSite(refreshCookieSameSite)
                .path("/api/auth")
                .maxAge(maxAgeSeconds)
                .build();
    }

    private ResponseCookie clearRefreshCookie() {
        return ResponseCookie.from(refreshCookieName, "")
                .httpOnly(true)
                .secure(refreshCookieSecure)
                .sameSite(refreshCookieSameSite)
                .path("/api/auth")
                .maxAge(0)
                .build();
    }

    private String extractRefreshToken(HttpServletRequest request) {
        if (request == null || request.getCookies() == null) {
            return null;
        }
        for (Cookie cookie : request.getCookies()) {
            if (refreshCookieName.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }

    private String extractClientKey(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
