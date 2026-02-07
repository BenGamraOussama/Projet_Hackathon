package com.astba.backend.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class SessionDetailResponse {
    private Long id;
    private Integer sessionIndex;
    private String title;
    private LocalDateTime startAt;
    private Integer durationMin;
    private String location;
    private String status;
}
