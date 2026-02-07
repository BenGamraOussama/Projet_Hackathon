package com.astba.backend.dto;

import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class AttendanceBulkRequest {
    private Long sessionId;
    private LocalDate date;
    private List<AttendanceRecordRequest> records;
}
