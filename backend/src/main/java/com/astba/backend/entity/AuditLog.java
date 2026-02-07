package com.astba.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "audit_logs")
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String actorEmail;
    private String action;
    private String entityType;
    private String entityId;

    @Column(length = 2000)
    private String details;

    private LocalDateTime createdAt;

    @PrePersist
    public void setCreatedAt() {
        createdAt = LocalDateTime.now();
    }
}
