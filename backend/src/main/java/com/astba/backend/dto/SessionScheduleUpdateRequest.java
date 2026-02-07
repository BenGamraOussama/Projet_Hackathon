package com.astba.backend.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class SessionScheduleUpdateRequest {
    private LocalDateTime startAt;
    private Integer durationMin;
    private String location;
    private String status;
}
