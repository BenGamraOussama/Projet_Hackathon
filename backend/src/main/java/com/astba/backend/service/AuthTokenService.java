package com.astba.backend.service;

import com.astba.backend.entity.PasswordResetToken;
import com.astba.backend.entity.RefreshToken;
import com.astba.backend.entity.User;
import com.astba.backend.repository.PasswordResetTokenRepository;
import com.astba.backend.repository.RefreshTokenRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthTokenService {
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;

    @Value("${jwt.refresh-expiration:1209600000}")
    private long refreshTokenExpirationMs;

    @Value("${jwt.reset-expiration:3600000}")
    private long resetTokenExpirationMs;

    private final SecureRandom secureRandom = new SecureRandom();

    public AuthTokenService(RefreshTokenRepository refreshTokenRepository,
            PasswordResetTokenRepository passwordResetTokenRepository) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
    }

    public String createRefreshToken(User user) {
        String rawToken = generateTokenValue();
        RefreshToken token = new RefreshToken();
        token.setId(generateId());
        token.setUser(user);
        token.setTokenHash(hashToken(rawToken));
        token.setCreatedAt(Instant.now());
        token.setExpiresAt(Instant.now().plusMillis(refreshTokenExpirationMs));
        refreshTokenRepository.save(token);
        return rawToken;
    }

    public Optional<RefreshToken> validateRefreshToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) return Optional.empty();
        String hashed = hashToken(rawToken);
        return refreshTokenRepository.findByTokenHash(hashed)
                .filter(token -> token.getRevokedAt() == null)
                .filter(token -> token.getExpiresAt().isAfter(Instant.now()));
    }

    public String rotateRefreshToken(RefreshToken current) {
        current.setRevokedAt(Instant.now());
        String rawToken = generateTokenValue();
        RefreshToken replacement = new RefreshToken();
        replacement.setId(generateId());
        replacement.setUser(current.getUser());
        replacement.setTokenHash(hashToken(rawToken));
        replacement.setCreatedAt(Instant.now());
        replacement.setExpiresAt(Instant.now().plusMillis(refreshTokenExpirationMs));
        refreshTokenRepository.save(replacement);
        current.setReplacedById(replacement.getId());
        refreshTokenRepository.save(current);
        return rawToken;
    }

    public void revokeRefreshToken(RefreshToken token) {
        token.setRevokedAt(Instant.now());
        refreshTokenRepository.save(token);
    }

    public void revokeAll(User user) {
        refreshTokenRepository.findByUser(user).forEach(this::revokeRefreshToken);
    }

    public String createPasswordResetToken(User user) {
        String rawToken = generateTokenValue();
        PasswordResetToken token = new PasswordResetToken();
        token.setId(generateId());
        token.setUser(user);
        token.setTokenHash(hashToken(rawToken));
        token.setCreatedAt(Instant.now());
        token.setExpiresAt(Instant.now().plusMillis(resetTokenExpirationMs));
        passwordResetTokenRepository.save(token);
        return rawToken;
    }

    public Optional<PasswordResetToken> validatePasswordResetToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) return Optional.empty();
        String hashed = hashToken(rawToken);
        return passwordResetTokenRepository.findByTokenHash(hashed)
                .filter(token -> token.getUsedAt() == null)
                .filter(token -> token.getExpiresAt().isAfter(Instant.now()));
    }

    public void markPasswordResetUsed(PasswordResetToken token) {
        token.setUsedAt(Instant.now());
        passwordResetTokenRepository.save(token);
    }

    private String generateId() {
        return UUID.randomUUID().toString().replace("-", "");
    }

    private String generateTokenValue() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to hash token", ex);
        }
    }
}
