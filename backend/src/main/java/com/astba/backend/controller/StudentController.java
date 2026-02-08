package com.astba.backend.controller;

import com.astba.backend.dto.StudentPendingResponse;
import com.astba.backend.dto.StudentProgressResponse;
import com.astba.backend.dto.UpdateStudentStatusRequest;
import com.astba.backend.entity.Student;
import com.astba.backend.repository.StudentRepository;
import com.astba.backend.repository.TrainingRepository;
import com.astba.backend.service.AuditService;
import com.astba.backend.service.EnrollmentService;
import com.astba.backend.service.MaxStudentsReachedException;
import com.astba.backend.service.ProgressService;
import com.astba.backend.service.StudentApprovalService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.Objects;

@RestController
@RequestMapping("/api/students")
public class StudentController {

    private final StudentRepository studentRepository;
    private final TrainingRepository trainingRepository;
    private final ProgressService progressService;
    private final EnrollmentService enrollmentService;
    private final AuditService auditService;
    private final StudentApprovalService studentApprovalService;

    public StudentController(StudentRepository studentRepository,
            TrainingRepository trainingRepository,
            ProgressService progressService,
            EnrollmentService enrollmentService,
            AuditService auditService,
            StudentApprovalService studentApprovalService) {
        this.studentRepository = studentRepository;
        this.trainingRepository = trainingRepository;
        this.progressService = progressService;
        this.enrollmentService = enrollmentService;
        this.auditService = auditService;
        this.studentApprovalService = studentApprovalService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','RESPONSABLE','FORMATEUR')")
    public List<Student> getAllStudents() {
        return studentRepository.findByStatus("APPROVED");
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public List<StudentPendingResponse> getPendingStudents(@RequestParam(required = false) String query) {
        List<Student> pending = studentRepository.findByStatus("PENDING");
        if (query != null && !query.isBlank()) {
            String q = query.toLowerCase();
            pending = pending.stream()
                    .filter(student -> (student.getEmail() != null && student.getEmail().toLowerCase().contains(q))
                            || (student.getFirstName() != null && student.getFirstName().toLowerCase().contains(q))
                            || (student.getLastName() != null && student.getLastName().toLowerCase().contains(q)))
                    .toList();
        }
        return pending.stream().map(StudentPendingResponse::new).toList();
    }

    @GetMapping("/pending/count")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getPendingCount() {
        long count = studentRepository.countByStatus("PENDING");
        return ResponseEntity.ok(java.util.Map.of("count", count));
    }

    @PostMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateStudentStatus(@PathVariable Long id, @RequestBody UpdateStudentStatusRequest request) {
        if (id == null || request == null || request.getStatus() == null || request.getStatus().isBlank()) {
            return ResponseEntity.badRequest().body("Student id and status are required");
        }
        String status = request.getStatus().trim().toUpperCase();
        if (!"APPROVED".equals(status) && !"REJECTED".equals(status)) {
            return ResponseEntity.badRequest().body("Invalid status");
        }

        return studentRepository.findById(id)
                .map(student -> {
                    try {
                        if ("APPROVED".equals(status)) {
                            Student saved = studentApprovalService.approve(student).getStudent();
                            auditService.log("APPROVE_STUDENT", "Student", String.valueOf(saved.getId()),
                                    "Student approved");
                            return ResponseEntity.ok(new StudentPendingResponse(saved));
                        }
                        Student saved = studentApprovalService.reject(student);
                        auditService.log("REJECT_STUDENT", "Student", String.valueOf(saved.getId()),
                                "Student rejected");
                        return ResponseEntity.ok(new StudentPendingResponse(saved));
                    } catch (MaxStudentsReachedException ex) {
                        return ResponseEntity.status(HttpStatus.CONFLICT).body(ex.getMessage());
                    }
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body("Student not found"));
    }

    @GetMapping("/progress")
    @PreAuthorize("hasAnyRole('ADMIN','RESPONSABLE','FORMATEUR')")
    public List<StudentProgressResponse> getStudentsProgress() {
        return studentRepository.findByStatus("APPROVED").stream()
                .map(progressService::buildProgress)
                .collect(java.util.stream.Collectors.toList());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','RESPONSABLE','FORMATEUR')")
    public ResponseEntity<Student> getStudentById(@PathVariable Long id) {
        if (id == null) {
            return ResponseEntity.badRequest().build();
        }
        return studentRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/progress")
    @PreAuthorize("hasAnyRole('ADMIN','RESPONSABLE','FORMATEUR')")
    public ResponseEntity<StudentProgressResponse> getStudentProgress(@PathVariable Long id) {
        if (id == null) {
            return ResponseEntity.badRequest().build();
        }
        return studentRepository.findById(id)
                .map(progressService::buildProgress)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','RESPONSABLE')")
    public Student createStudent(@RequestBody Student student) {
        if (student == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Student is required");
        }
        student.setEnrollmentDate(LocalDate.now());
        student.setStatus("APPROVED");
        if (student.getCurrentLevel() == null) {
            student.setCurrentLevel(1);
        }

        if (student.getTraining() != null) {
            Long trainingId = student.getTraining().getId();
            if (trainingId != null) {
                trainingRepository.findById(trainingId)
                        .ifPresent(student::setTraining);
            }
        }

        Student saved = studentRepository.save(student);
        if (saved.getTraining() != null) {
            enrollmentService.ensureActiveEnrollment(saved, saved.getTraining());
        }
        auditService.log("CREATE_STUDENT", "Student", String.valueOf(saved.getId()),
                "Student created");
        return saved;
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','RESPONSABLE')")
    public ResponseEntity<Student> updateStudent(@PathVariable Long id, @RequestBody Student updated) {
        if (id == null || updated == null) {
            return ResponseEntity.badRequest().build();
        }
        return studentRepository.findById(id)
                .map(existing -> {
                    Long previousTrainingId = existing.getTraining() != null ? existing.getTraining().getId() : null;
                    if (updated.getFirstName() != null) {
                        existing.setFirstName(updated.getFirstName());
                    }
                    if (updated.getLastName() != null) {
                        existing.setLastName(updated.getLastName());
                    }
                    if (updated.getEmail() != null) {
                        existing.setEmail(updated.getEmail());
                    }
                    if (updated.getPhone() != null) {
                        existing.setPhone(updated.getPhone());
                    }
                    if (updated.getStatus() != null) {
                        existing.setStatus(updated.getStatus());
                    }
                    if (updated.getCurrentLevel() != null) {
                        existing.setCurrentLevel(updated.getCurrentLevel());
                    }

                    if (updated.getTraining() != null) {
                        Long trainingId = updated.getTraining().getId();
                        if (trainingId != null) {
                            trainingRepository.findById(trainingId)
                                    .ifPresent(existing::setTraining);
                        }
                    }

                    Student saved = studentRepository.save(existing);
                    Long newTrainingId = saved.getTraining() != null ? saved.getTraining().getId() : null;
                    if (!Objects.equals(previousTrainingId, newTrainingId)) {
                        if (saved.getTraining() != null) {
                            enrollmentService.ensureActiveEnrollment(saved, saved.getTraining());
                        } else {
                            enrollmentService.closeActiveEnrollment(saved);
                        }
                    }
                    auditService.log("UPDATE_STUDENT", "Student", String.valueOf(saved.getId()),
                            "Student updated");
                    return ResponseEntity.ok(saved);
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
