package com.astba.backend.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(
        name = "levels",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_level_training_level_number",
                        columnNames = { "training_id", "level_number" })
        }
)
public class Level {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "training_id")
    private Training training;

    @Column(name = "level_number")
    private Integer levelNumber;

    private String name;

    @Column(length = 1000)
    private String description;
}
