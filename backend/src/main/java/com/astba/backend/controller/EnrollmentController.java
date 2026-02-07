package com.astba.backend.controller;

import com.astba.backend.entity.Enrollment;
import com.astba.backend.repository.EnrollmentRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/enrollments")
public class EnrollmentController {

    private final EnrollmentRepository enrollmentRepository;

    public EnrollmentController(EnrollmentRepository enrollmentRepository) {
        this.enrollmentRepository = enrollmentRepository;
    }

    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasAnyRole('ADMIN','RESPONSABLE','FORMATEUR')")
    public List<Enrollment> getEnrollmentsByStudent(@PathVariable Long studentId) {
        return enrollmentRepository.findByStudentIdOrderByStartDateDesc(studentId);
    }
}
