package com.astba.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Data
public class Training {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    @Column(length = 1000)
    private String description;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TrainingCreationMode creationMode = TrainingCreationMode.AUTO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TrainingStructureStatus structureStatus = TrainingStructureStatus.NOT_GENERATED;
}
