package com.astba.backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class LevelCreateRequest {
    @NotNull
    private Integer levelIndex;
    private String title;
    private String description;
}
