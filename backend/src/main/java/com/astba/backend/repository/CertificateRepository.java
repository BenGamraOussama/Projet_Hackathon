package com.astba.backend.repository;

import com.astba.backend.entity.Certificate;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CertificateRepository extends JpaRepository<Certificate, Long> {
    List<Certificate> findByStudentId(Long studentId);
    Optional<Certificate> findByStudentIdAndTrainingId(Long studentId, Long trainingId);
    boolean existsByCertificateId(String certificateId);
}
