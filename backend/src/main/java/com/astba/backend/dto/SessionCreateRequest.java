package com.astba.backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class SessionCreateRequest {
    @NotNull
    private Integer sessionIndex;
    private String title;
    private String objective;
    private LocalDateTime startAt;
    private Integer durationMin;
    private String location;
    private String status;
    private String modality;
    private String materials;
    private String accessibilityNotes;
}
