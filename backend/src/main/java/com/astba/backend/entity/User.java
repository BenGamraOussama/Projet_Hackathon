package com.astba.backend.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;

@Entity
@Data
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String email;
    private String password;
    private String role;
    private String firstName;
    private String lastName;

    private String status;
    private String gender;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    private String phone;

    @Column(length = 255)
    private String address;

    @Column(name = "career_description", length = 2000)
    private String careerDescription;
}
