package com.astba.backend.service;

import com.astba.backend.dto.ReportSummaryResponse;
import com.astba.backend.dto.StudentProgressResponse;
import com.astba.backend.entity.Student;
import com.astba.backend.repository.AttendanceRepository;
import com.astba.backend.repository.CertificateRepository;
import com.astba.backend.repository.SessionRepository;
import com.astba.backend.repository.StudentRepository;
import com.astba.backend.repository.TrainingRepository;
import org.springframework.stereotype.Service;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReportService {

    private final StudentRepository studentRepository;
    private final TrainingRepository trainingRepository;
    private final SessionRepository sessionRepository;
    private final AttendanceRepository attendanceRepository;
    private final CertificateRepository certificateRepository;
    private final ProgressService progressService;

    public ReportService(StudentRepository studentRepository,
            TrainingRepository trainingRepository,
            SessionRepository sessionRepository,
            AttendanceRepository attendanceRepository,
            CertificateRepository certificateRepository,
            ProgressService progressService) {
        this.studentRepository = studentRepository;
        this.trainingRepository = trainingRepository;
        this.sessionRepository = sessionRepository;
        this.attendanceRepository = attendanceRepository;
        this.certificateRepository = certificateRepository;
        this.progressService = progressService;
    }

    public ReportSummaryResponse buildSummary() {
        List<Student> students = studentRepository.findAll();
        List<StudentProgressResponse> progress = students.stream()
                .map(progressService::buildProgress)
                .collect(Collectors.toList());

        ReportSummaryResponse summary = new ReportSummaryResponse();
        summary.setTotalStudents(students.size());
        summary.setTotalTrainings((int) trainingRepository.count());
        summary.setTotalSessions((int) sessionRepository.count());
        summary.setTotalAttendanceRecords((int) attendanceRepository.count());
        summary.setCertificatesIssued((int) certificateRepository.count());
        summary.setTrainingsCompleted((int) progress.stream()
                .filter(p -> p.getTotalSessions() != null && p.getCompletedSessions() != null
                        && p.getCompletedSessions() >= p.getTotalSessions() && p.getTotalSessions() > 0)
                .count());

        List<ReportSummaryResponse.AtRiskStudent> atRisk = progress.stream()
                .filter(p -> p.getTrainingId() != null)
                .filter(p -> (p.getAttendanceRate() != null && p.getAttendanceRate() < 80)
                        || (p.getMissingSessions() != null && p.getMissingSessions() > 2)
                        || (p.getAbsentCount() != null && p.getAbsentCount() >= 2))
                .sorted(Comparator.comparingInt(p -> p.getAttendanceRate() == null ? 0 : p.getAttendanceRate()))
                .limit(10)
                .map(p -> {
                    ReportSummaryResponse.AtRiskStudent dto = new ReportSummaryResponse.AtRiskStudent();
                    dto.setStudentId(p.getStudentId());
                    dto.setName((p.getFirstName() == null ? "" : p.getFirstName()) + " "
                            + (p.getLastName() == null ? "" : p.getLastName()));
                    dto.setTrainingName(p.getTrainingName());
                    dto.setAttendanceRate(p.getAttendanceRate());
                    dto.setAbsentCount(p.getAbsentCount());
                    dto.setMissingSessions(p.getMissingSessions());
                    return dto;
                })
                .collect(Collectors.toList());

        summary.setAtRiskStudents(atRisk);
        return summary;
    }
}
