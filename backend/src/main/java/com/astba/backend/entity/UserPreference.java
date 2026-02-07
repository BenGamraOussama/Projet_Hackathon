package com.astba.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "user_preferences")
public class UserPreference {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", unique = true)
    private User user;

    private String fontSize;
    private String contrast;
    private Boolean animations;
    private Boolean screenReader;
    private Boolean focusHighlight;
    private String lineSpacing;
    private String cursorSize;
    private String colorBlindMode;
    private Boolean simplifyUi;

    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    public void touchUpdatedAt() {
        updatedAt = LocalDateTime.now();
    }
}
