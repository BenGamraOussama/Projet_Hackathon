package com.astba.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Data
public class Student {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private LocalDate enrollmentDate;
    private String status;
    private Integer currentLevel;

    @ManyToOne
    @JoinColumn(name = "training_id")
    private Training training;
}
