package com.astba.backend.service;

import com.astba.backend.entity.Student;
import com.astba.backend.repository.StudentRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Locale;

@Service
public class StudentApprovalService {
    private final StudentRepository studentRepository;
    private final SettingsService settingsService;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    public StudentApprovalService(StudentRepository studentRepository,
            SettingsService settingsService,
            PasswordEncoder passwordEncoder,
            EmailService emailService) {
        this.studentRepository = studentRepository;
        this.settingsService = settingsService;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    public StudentApprovalResult approve(Student student) {
        if (student == null) {
            throw new IllegalArgumentException("Student is required");
        }
        long approvedCount = studentRepository.countByStatus("APPROVED");
        int maxStudents = settingsService.getMaxStudents();
        if (approvedCount >= maxStudents) {
            throw new MaxStudentsReachedException("MAX_STUDENTS_REACHED");
        }

        String studentCode = generateUniqueCode(student.getGender());
        String tempPassword = generatePassword();

        student.setStudentCode(studentCode);
        student.setPasswordHash(passwordEncoder.encode(tempPassword));
        student.setStatus("APPROVED");
        if (student.getEnrollmentDate() == null) {
            student.setEnrollmentDate(LocalDate.now());
        }
        if (student.getCurrentLevel() == null || student.getCurrentLevel() < 1) {
            student.setCurrentLevel(1);
        }

        Student saved = studentRepository.save(student);
        emailService.sendStudentAcceptedEmail(saved, studentCode, tempPassword);
        return new StudentApprovalResult(saved, tempPassword);
    }

    public Student reject(Student student) {
        if (student == null) {
            throw new IllegalArgumentException("Student is required");
        }
        student.setStatus("REJECTED");
        return studentRepository.save(student);
    }

    private String generateUniqueCode(String gender) {
        String genderCode = resolveGenderCode(gender);
        String code;
        int attempts = 0;
        do {
            code = randomDigits(3) + genderCode + randomDigits(3);
            attempts++;
            if (attempts > 100) {
                throw new IllegalStateException("Unable to generate unique student code");
            }
        } while (studentRepository.findByStudentCode(code).isPresent());
        return code;
    }

    private String resolveGenderCode(String gender) {
        if (gender == null) {
            return "MSB";
        }
        String normalized = gender.trim().toUpperCase(Locale.ROOT);
        if (normalized.equals("F") || normalized.equals("FEMME") || normalized.equals("FEMALE")) {
            return "FSB";
        }
        return "MSB";
    }

    private String randomDigits(int count) {
        StringBuilder builder = new StringBuilder();
        for (int i = 0; i < count; i++) {
            builder.append((int) (Math.random() * 10));
        }
        return builder.toString();
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
