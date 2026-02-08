package com.astba.backend.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class StudentSignupRequest {
    private String firstName;
    private String lastName;
    private String gender;
    private LocalDate birthDate;
    private String email;
    private String phone;
    private String address;
}
