package com.astba.backend.controller;

import com.astba.backend.dto.AttendanceBulkRequest;
import com.astba.backend.dto.AttendanceRecordRequest;
import com.astba.backend.entity.Attendance;
import com.astba.backend.entity.Student;
import com.astba.backend.repository.AttendanceRepository;
import com.astba.backend.repository.StudentRepository;
import com.astba.backend.service.AuditService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    private final AttendanceRepository attendanceRepository;
    private final StudentRepository studentRepository;
    private final AuditService auditService;

    public AttendanceController(AttendanceRepository attendanceRepository,
            StudentRepository studentRepository,
            AuditService auditService) {
        this.attendanceRepository = attendanceRepository;
        this.studentRepository = studentRepository;
        this.auditService = auditService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','RESPONSABLE','FORMATEUR')")
    public List<Attendance> getAttendance(@RequestParam(required = false) Long studentId,
            @RequestParam(required = false) Long trainingId,
            @RequestParam(required = false) Long sessionId) {
        if (studentId != null) {
            return attendanceRepository.findByStudentId(studentId);
        }
        if (sessionId != null) {
            return attendanceRepository.findBySessionId(sessionId);
        }
        if (trainingId != null) {
            return attendanceRepository.findByStudentTrainingId(trainingId);
        }
        return attendanceRepository.findAll();
    }

    @PostMapping("/bulk")
    @PreAuthorize("hasAnyRole('ADMIN','FORMATEUR')")
    public ResponseEntity<?> saveAttendanceBulk(@RequestBody AttendanceBulkRequest request) {
        if (request == null) {
            return ResponseEntity.badRequest().body("Request body is required");
        }
        if (request.getRecords() == null || request.getRecords().isEmpty()) {
            return ResponseEntity.badRequest().body("Records are required");
        }
        Long sessionId = request.getSessionId();
        if (sessionId == null) {
            return ResponseEntity.badRequest().body("SessionId is required");
        }

        LocalDate date = request.getDate() != null ? request.getDate() : LocalDate.now();
        List<Attendance> toSave = new ArrayList<>();

        for (AttendanceRecordRequest record : request.getRecords()) {
            if (record == null) {
                continue;
            }
            Long studentId = record.getStudentId();
            if (studentId == null) {
                continue;
            }
            Optional<Student> studentOpt = studentRepository.findById(studentId);
            if (studentOpt.isEmpty()) {
                continue;
            }   
            List<Attendance> existing = attendanceRepository
                    .findByStudentIdAndSessionId(studentId, sessionId);

            Attendance attendance;
            if (existing.isEmpty()) {
                attendance = new Attendance();
            } else {
                attendance = existing.stream()
                        .max((a, b) -> Long.compare(a.getId(), b.getId()))
                        .orElse(existing.get(0));
                if (existing.size() > 1) {
                    List<Attendance> duplicates = new ArrayList<>(existing);
                    duplicates.remove(attendance);
                    attendanceRepository.deleteAll(duplicates);
                }
            }

            attendance.setStudent(studentOpt.get());
            attendance.setSessionId(sessionId);
            attendance.setDate(date);
            attendance.setStatus(record.getStatus());
            toSave.add(attendance);
        }

        List<Attendance> saved = attendanceRepository.saveAll(toSave);
        auditService.log("MARK_ATTENDANCE", "Session",
                String.valueOf(sessionId),
                "Attendance marked for " + saved.size() + " student(s)");
        return ResponseEntity.ok(saved);
    }
}
