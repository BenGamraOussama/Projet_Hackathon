package com.astba.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Data
@Table(
        name = "certificates",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = { "student_id", "training_id" })
        }
)
public class Certificate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "student_id")
    private Student student;

    @ManyToOne
    @JoinColumn(name = "training_id")
    private Training training;

    @Column(unique = true)
    private String certificateId;

    private LocalDate issueDate;
}
