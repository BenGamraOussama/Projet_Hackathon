package com.astba.backend.dto;

import lombok.Data;

@Data
public class UpdateUserRequest {
    private String email;
    private String password;
    private String role;
    private String firstName;
    private String lastName;
    private String phone;
    private String address;
    private String careerDescription;
    private Boolean generatePassword;
    private Boolean sendEmail;
}
