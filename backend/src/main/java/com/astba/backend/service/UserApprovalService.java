package com.astba.backend.service;

import com.astba.backend.entity.User;
import com.astba.backend.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserApprovalService {
    private final UserRepository userRepository;
    private final SettingsService settingsService;
    private final PasswordEncoder passwordEncoder;

    public UserApprovalService(UserRepository userRepository,
            SettingsService settingsService,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.settingsService = settingsService;
        this.passwordEncoder = passwordEncoder;
    }

    public UserApprovalResult updateStatus(User user, String status, boolean issueCredentials) {
        if (user == null) {
            throw new IllegalArgumentException("User is required");
        }
        if (status == null || status.isBlank()) {
            throw new IllegalArgumentException("Status is required");
        }
        String normalizedStatus = status.trim().toUpperCase();
        if (!"APPROVED".equals(normalizedStatus) && !"REJECTED".equals(normalizedStatus)) {
            throw new IllegalArgumentException("Invalid status");
        }

        String tempPassword = null;
        boolean isStudent = "ELEVE".equalsIgnoreCase(user.getRole());

        if ("APPROVED".equals(normalizedStatus)) {
            if (isStudent) {
                long approvedCount = userRepository.countByRoleAndStatus("ELEVE", "APPROVED");
                int maxStudents = settingsService.getMaxStudents();
                if (approvedCount >= maxStudents) {
                    throw new MaxStudentsReachedException("MAX_STUDENTS_REACHED");
                }
            }

            if (isStudent || issueCredentials) {
                tempPassword = generatePassword();
                user.setPassword(passwordEncoder.encode(tempPassword));
            }
            user.setStatus("APPROVED");
            User saved = userRepository.save(user);
            return new UserApprovalResult(saved, tempPassword);
        }

        user.setStatus("REJECTED");
        User saved = userRepository.save(user);
        return new UserApprovalResult(saved, null);
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
}

