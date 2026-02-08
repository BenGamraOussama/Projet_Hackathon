package com.astba.backend.repository;

import com.astba.backend.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface StudentRepository extends JpaRepository<Student, Long> {
    List<Student> findByTrainingId(Long trainingId);

    List<Student> findByEmailContainingOrFirstNameContainingOrLastNameContaining(String email, String firstName,
            String lastName);

    Optional<Student> findByEmail(String email);
    Optional<Student> findByStudentCode(String studentCode);
    long countByStatus(String status);
    List<Student> findByStatus(String status);
}
