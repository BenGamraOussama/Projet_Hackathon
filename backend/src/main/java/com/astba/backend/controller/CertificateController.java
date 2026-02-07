package com.astba.backend.controller;

import com.astba.backend.dto.CertificateRequest;
import com.astba.backend.entity.Attendance;
import com.astba.backend.entity.Certificate;
import com.astba.backend.entity.Session;
import com.astba.backend.entity.Student;
import com.astba.backend.entity.Training;
import com.astba.backend.repository.AttendanceRepository;
import com.astba.backend.repository.CertificateRepository;
import com.astba.backend.repository.SessionRepository;
import com.astba.backend.repository.StudentRepository;
import com.astba.backend.repository.TrainingRepository;
import com.astba.backend.service.AuditService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/certificates")
public class CertificateController {

    private final CertificateRepository certificateRepository;
    private final StudentRepository studentRepository;
    private final TrainingRepository trainingRepository;
    private final AttendanceRepository attendanceRepository;
    private final SessionRepository sessionRepository;
    private final AuditService auditService;

    public CertificateController(CertificateRepository certificateRepository,
            StudentRepository studentRepository,
            TrainingRepository trainingRepository,
            AttendanceRepository attendanceRepository,
            SessionRepository sessionRepository,
            AuditService auditService) {
        this.certificateRepository = certificateRepository;
        this.studentRepository = studentRepository;
        this.trainingRepository = trainingRepository;
        this.attendanceRepository = attendanceRepository;
        this.sessionRepository = sessionRepository;
        this.auditService = auditService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','RESPONSABLE','FORMATEUR')")
    public List<Certificate> getCertificates(@RequestParam(required = false) Long studentId) {
        if (studentId != null) {
            return certificateRepository.findByStudentId(studentId);
        }
        return certificateRepository.findAll();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','RESPONSABLE')")
    public ResponseEntity<?> generateCertificate(@RequestBody CertificateRequest request) {
        if (request == null) {
            return ResponseEntity.badRequest().body("Request body is required");
        }

        Long studentId = request.getStudentId();
        Long trainingId = request.getTrainingId();
        if (studentId == null || trainingId == null) {
            return ResponseEntity.badRequest().body("StudentId and TrainingId are required");
        }

        Optional<Student> studentOpt = studentRepository.findById(studentId);
        Optional<Training> trainingOpt = trainingRepository.findById(trainingId);
        if (studentOpt.isEmpty() || trainingOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Student or Training not found");
        }

        Optional<Certificate> existing = certificateRepository
                .findByStudentIdAndTrainingId(studentId, trainingId);
        if (existing.isPresent()) {
            return ResponseEntity.ok(existing.get());
        }

        List<Session> sessions = sessionRepository.findByTrainingId(trainingId);
        int totalSessions = sessions.isEmpty() ? 24 : sessions.size();
        Set<Long> sessionIds = new HashSet<>();
        for (Session session : sessions) {
            if (session.getId() != null) {
                sessionIds.add(session.getId());
            }
        }

        List<Attendance> attendanceRecords = attendanceRepository.findByStudentId(studentId);
        List<Attendance> trainingAttendance = attendanceRecords.stream()
                .filter(record -> sessionIds.isEmpty() || sessionIds.contains(record.getSessionId()))
                .collect(Collectors.toList());

        int completedSessions = trainingAttendance.size();
        long presentCount = trainingAttendance.stream()
                .filter(record -> "present".equalsIgnoreCase(record.getStatus())
                        || "late".equalsIgnoreCase(record.getStatus()))
                .count();
        int attendanceRate = completedSessions > 0
                ? Math.toIntExact(Math.round((presentCount * 100.0) / completedSessions))
                : 0;

        boolean eligible = completedSessions >= totalSessions && attendanceRate >= 80;
        if (!eligible) {
            return ResponseEntity.badRequest().body("Student is not eligible for certification");
        }

        Certificate certificate = new Certificate();
        certificate.setStudent(studentOpt.get());
        certificate.setTraining(trainingOpt.get());
        certificate.setIssueDate(LocalDate.now());
        certificate.setCertificateId(generateCertificateId());

        Certificate saved = certificateRepository.save(certificate);
        auditService.log("GENERATE_CERTIFICATE", "Certificate",
                String.valueOf(saved.getId()),
                "Certificate generated for student " + studentId);
        return ResponseEntity.ok(saved);
    }

    private String generateCertificateId() {
        String year = String.valueOf(LocalDate.now().getYear());
        for (int attempt = 0; attempt < 5; attempt++) {
            int random = (int) (Math.random() * 9000) + 1000;
            String candidate = "ASTBA-" + year + "-" + random;
            if (!certificateRepository.existsByCertificateId(candidate)) {
                return candidate;
            }
        }
        return "ASTBA-" + year + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}
