package com.astba.backend.service;

import com.astba.backend.entity.Enrollment;
import com.astba.backend.entity.Student;
import com.astba.backend.entity.Training;
import com.astba.backend.repository.EnrollmentRepository;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.Optional;

@Service
public class EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;

    public EnrollmentService(EnrollmentRepository enrollmentRepository) {
        this.enrollmentRepository = enrollmentRepository;
    }

    public Enrollment ensureActiveEnrollment(Student student, Training training) {
        if (student == null || training == null) {
            return null;
        }
        Optional<Enrollment> active = enrollmentRepository
                .findFirstByStudentIdAndStatusOrderByStartDateDesc(student.getId(), "ACTIVE");
        if (active.isPresent() && active.get().getTraining() != null
                && training.getId() != null
                && training.getId().equals(active.get().getTraining().getId())) {
            return active.get();
        }
        active.ifPresent(existing -> closeEnrollment(existing));

        Enrollment enrollment = new Enrollment();
        enrollment.setStudent(student);
        enrollment.setTraining(training);
        enrollment.setStartDate(LocalDate.now());
        enrollment.setStatus("ACTIVE");
        return enrollmentRepository.save(enrollment);
    }

    public void closeEnrollment(Enrollment enrollment) {
        if (enrollment == null) {
            return;
        }
        enrollment.setStatus("COMPLETED");
        enrollment.setEndDate(LocalDate.now());
        enrollmentRepository.save(enrollment);
    }

    public void closeActiveEnrollment(Student student) {
        if (student == null || student.getId() == null) {
            return;
        }
        enrollmentRepository.findFirstByStudentIdAndStatusOrderByStartDateDesc(student.getId(), "ACTIVE")
                .ifPresent(this::closeEnrollment);
    }
}
