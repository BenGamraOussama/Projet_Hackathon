package com.astba.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(
        name = "sessions",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_session_level_session_number",
                        columnNames = { "level_id", "session_number" })
        }
)
public class Session {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "training_id")
    private Training training;

    @ManyToOne
    @JoinColumn(name = "level_id")
    private Level level;

    @Column(name = "level_number")
    private Integer levelNumber;

    @Column(name = "session_number")
    private Integer sessionNumber;

    private String title;
    @Column(length = 500)
    private String objective;
    private LocalDateTime startAt;
    private Integer durationMin;
    private String location;
    private String status;
    private String modality;
    @Column(length = 2000, name = "materials")
    private String materials;
    @Column(length = 2000, name = "accessibility_notes")
    private String accessibilityNotes;
}
