package com.astba.backend.dto;

import com.astba.backend.entity.TrainingCreationMode;
import com.astba.backend.entity.TrainingStructureStatus;
import lombok.Data;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
public class TrainingDetailResponse {
    private Long id;
    private String title;
    private String description;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
    private TrainingCreationMode creationMode;
    private TrainingStructureStatus structureStatus;
    private List<LevelDetailResponse> levels = new ArrayList<>();
}
