package com.astba.backend.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class StudentProgressResponse {
    private Long studentId;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private LocalDate enrollmentDate;
    private String status;
    private Integer currentLevel;
    private Long trainingId;
    private String trainingName;

    private Integer completedSessions;
    private Integer totalSessions;
    private Integer attendanceRate;
    private Integer levelsCompleted;
    private Integer totalLevels;
    private Integer sessionsRemaining;
    private Integer levelsRemaining;
    private Boolean eligibleForCertification;

    private Integer missingSessions;
    private Integer missingLevel;
    private String blockReason;

    private Integer absentCount;
}
