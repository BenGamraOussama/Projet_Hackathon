package com.astba.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import com.fasterxml.jackson.annotation.JsonIgnore;
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
    private String gender;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    @Column(length = 255)
    private String address;

    @Column(name = "student_code", unique = true)
    private String studentCode;

    @JsonIgnore
    @Column(name = "password_hash")
    private String passwordHash;

    @ManyToOne
    @JoinColumn(name = "training_id")
    private Training training;
}
