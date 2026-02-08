package com.astba.backend.service;

import com.astba.backend.dto.ApplicationResponse;
import com.astba.backend.dto.JobApplicationRequest;
import com.astba.backend.dto.StudentSignupRequest;
import com.astba.backend.entity.Student;
import com.astba.backend.entity.User;
import com.astba.backend.repository.StudentRepository;
import com.astba.backend.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;

@Service
public class ApplicationService {
    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final PasswordEncoder passwordEncoder;

    public ApplicationService(UserRepository userRepository,
            StudentRepository studentRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.studentRepository = studentRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public ApplicationResponse submitJobApplication(JobApplicationRequest request) {
        ensureEmailAvailable(request.getEmail());
        String role = normalizeJobRole(request.getRequestedRole());

        User user = new User();
        user.setEmail(request.getEmail());
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setRole(role);
        user.setStatus("PENDING");
        user.setGender(request.getGender());
        user.setBirthDate(request.getBirthDate());
        user.setPhone(request.getPhone());
        user.setAddress(request.getAddress());
        user.setCareerDescription(request.getCareerDescription());
        user.setPassword(passwordEncoder.encode(generateTempPassword()));

        User saved = userRepository.save(user);
        // Use a properly encoded message (UTF-8) to avoid unmappable character issues
        return new ApplicationResponse(saved.getId(), saved.getStatus(), "Demande envoyée.");
    }

    public ApplicationResponse submitStudentSignup(StudentSignupRequest request) {
        ensureStudentEmailAvailable(request.getEmail());

        Student student = new Student();
        student.setEmail(request.getEmail());
        student.setFirstName(request.getFirstName());
        student.setLastName(request.getLastName());
        student.setGender(request.getGender());
        student.setBirthDate(request.getBirthDate());
        student.setPhone(request.getPhone());
        student.setAddress(request.getAddress());
        student.setStatus("PENDING");
        student.setEnrollmentDate(LocalDate.now());
        student.setCurrentLevel(0);

        Student saved = studentRepository.save(student);

        String message = "Votre inscription est en attente de validation par l'administrateur.";
        return new ApplicationResponse(saved.getId(), saved.getStatus(), message);
    }

    public void notifyStudentStatus(User user, String status, String temporaryPassword, boolean limitReached) {
        // no-op for students: approvals are handled via StudentApprovalService
    }

    private void ensureEmailAvailable(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }
        if (userRepository.findByEmail(email).isPresent()) {
            throw new IllegalStateException("Email already exists");
        }
    }

    private void ensureStudentEmailAvailable(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }
        if (studentRepository.findByEmail(email).isPresent() || userRepository.findByEmail(email).isPresent()) {
            throw new IllegalStateException("Email already exists");
        }
    }

    private String normalizeJobRole(String role) {
        if (role == null) return "FORMATEUR";
        String normalized = role.trim().toUpperCase(Locale.ROOT);
        if (!List.of("FORMATEUR", "RESPONSABLE").contains(normalized)) {
            return "FORMATEUR";
        }
        return normalized;
    }

    private String generateTempPassword() {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$";
        StringBuilder builder = new StringBuilder();
        for (int i = 0; i < 10; i++) {
            int idx = (int) (Math.random() * chars.length());
            builder.append(chars.charAt(idx));
        }
        return builder.toString();
    }
}

