package com.astba.backend.controller;

import com.astba.backend.dto.CreateUserRequest;
import com.astba.backend.dto.UpdateUserRequest;
import com.astba.backend.dto.UserCreateResponse;
import com.astba.backend.dto.UserResponse;
import com.astba.backend.entity.User;
import com.astba.backend.repository.UserRepository;
import com.astba.backend.service.AuditService;
import com.astba.backend.service.EmailService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final AuditService auditService;

    public UserController(UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            EmailService emailService,
            AuditService auditService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.auditService = auditService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Optional<User> user = userRepository.findByEmail(authentication.getName());
        return user.map(value -> ResponseEntity.ok(new UserResponse(value)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserResponse> getUsers(@RequestParam(required = false) String role) {
        List<User> users;
        if (role == null || role.isBlank()) {
            users = userRepository.findAll();
        } else {
            users = userRepository.findAll().stream()
                    .filter(u -> role.equalsIgnoreCase(u.getRole()))
                    .collect(Collectors.toList());
        }
        return users.stream().map(UserResponse::new).collect(Collectors.toList());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createUser(@RequestBody CreateUserRequest request) {
        if (request == null) {
            return ResponseEntity.badRequest().body("Request body is required");
        }
        if (request.getEmail() == null || request.getEmail().isBlank()
                || (request.getPassword() == null || request.getPassword().isBlank())
                        && !Boolean.TRUE.equals(request.getGeneratePassword())) {
            return ResponseEntity.badRequest().body("Email and password are required");
        }

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Email already exists");
        }

        String rawPassword = request.getPassword();
        if (Boolean.TRUE.equals(request.getGeneratePassword()) || rawPassword == null || rawPassword.isBlank()) {
            rawPassword = generatePassword();
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        String role = normalizeRole(request.getRole());
        user.setRole(role);

        User saved = userRepository.save(user);
        boolean emailSent = false;
        String emailError = null;
        if (Boolean.TRUE.equals(request.getSendEmail())) {
            try {
                emailService.sendLoginEmail(saved, rawPassword);
                emailSent = true;
            } catch (Exception ex) {
                emailError = ex.getMessage();
            }
        }
        auditService.log("CREATE_USER", "User", String.valueOf(saved.getId()), "User created");
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new UserCreateResponse(new UserResponse(saved), rawPassword, emailSent, emailError));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody UpdateUserRequest request) {
        if (id == null || request == null) {
            return ResponseEntity.badRequest().body("User id and request body are required");
        }
        return userRepository.findById(id)
                .map(user -> {
                    User target = Objects.requireNonNull(user, "User is required");
                    if (request.getEmail() != null && !request.getEmail().isBlank()) {
                        Optional<User> existing = userRepository.findByEmail(request.getEmail());
                        if (existing.isPresent() && !existing.get().getId().equals(id)) {
                            return ResponseEntity.status(HttpStatus.CONFLICT).body("Email already exists");
                        }
                        target.setEmail(request.getEmail());
                    }
                    if (request.getFirstName() != null) {
                        target.setFirstName(request.getFirstName());
                    }
                    if (request.getLastName() != null) {
                        target.setLastName(request.getLastName());
                    }
                    if (request.getRole() != null && !request.getRole().isBlank()) {
                        target.setRole(normalizeRole(request.getRole()));
                    }

                    String rawPassword = request.getPassword();
                    if (Boolean.TRUE.equals(request.getGeneratePassword())) {
                        rawPassword = generatePassword();
                    }
                    if (rawPassword != null && !rawPassword.isBlank()) {
                        target.setPassword(passwordEncoder.encode(rawPassword));
                    }

                    User saved = userRepository.save(target);
                    boolean emailSent = false;
                    String emailError = null;
                    if (Boolean.TRUE.equals(request.getSendEmail()) && rawPassword != null && !rawPassword.isBlank()) {
                        try {
                            emailService.sendLoginEmail(saved, rawPassword);
                            emailSent = true;
                        } catch (Exception ex) {
                            emailError = ex.getMessage();
                        }
                    }
                    auditService.log("UPDATE_USER", "User", String.valueOf(saved.getId()), "User updated");
                    return ResponseEntity.ok(new UserCreateResponse(new UserResponse(saved), rawPassword, emailSent, emailError));
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        if (id == null) {
            return ResponseEntity.badRequest().body("User id is required");
        }
        if (!userRepository.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        }
        userRepository.deleteById(id);
        auditService.log("DELETE_USER", "User", String.valueOf(id), "User deleted");
        return ResponseEntity.noContent().build();
    }

    private String generatePassword() {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$";
        StringBuilder builder = new StringBuilder();
        for (int i = 0; i < 10; i++) {
            int idx = (int) (Math.random() * chars.length());
            builder.append(chars.charAt(idx));
        }
        return builder.toString();
    }

    private String normalizeRole(String role) {
        String normalized = role == null || role.isBlank() ? "FORMATEUR" : role.trim().toUpperCase();
        if (!"ADMIN".equals(normalized)
                && !"RESPONSABLE".equals(normalized)
                && !"FORMATEUR".equals(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid role");
        }
        return normalized;
    }
}
