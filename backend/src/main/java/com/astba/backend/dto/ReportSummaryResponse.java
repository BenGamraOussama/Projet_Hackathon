package com.astba.backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class ReportSummaryResponse {
    private Integer totalStudents;
    private Integer totalTrainings;
    private Integer totalSessions;
    private Integer totalAttendanceRecords;
    private Integer certificatesIssued;
    private Integer trainingsCompleted;
    private List<AtRiskStudent> atRiskStudents;

    @Data
    public static class AtRiskStudent {
        private Long studentId;
        private String name;
        private String trainingName;
        private Integer attendanceRate;
        private Integer absentCount;
        private Integer missingSessions;
    }
}
