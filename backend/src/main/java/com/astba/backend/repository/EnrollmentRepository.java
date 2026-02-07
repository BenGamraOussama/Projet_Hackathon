package com.astba.backend.repository;

import com.astba.backend.entity.Enrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {
    List<Enrollment> findByStudentIdOrderByStartDateDesc(Long studentId);
    Optional<Enrollment> findFirstByStudentIdAndStatusOrderByStartDateDesc(Long studentId, String status);
}
