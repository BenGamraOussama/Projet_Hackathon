package com.astba.backend.dto;

import com.astba.backend.entity.TrainingCreationMode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;

@Data
public class TrainingCreateRequest {
    @NotBlank
    private String title;
    private String description;
    @NotNull
    private TrainingCreationMode creationMode;
    @NotNull
    private Integer levelsCount;
    @NotNull
    private Integer sessionsPerLevel;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
}
