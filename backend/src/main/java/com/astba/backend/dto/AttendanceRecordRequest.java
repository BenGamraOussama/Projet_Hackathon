package com.astba.backend.dto;

import lombok.Data;

@Data
public class AttendanceRecordRequest {
    private Long studentId;
    private String status;
}
