package com.astba.backend.dto;

import lombok.Data;

@Data
public class CreateUserRequest {
    private String email;
    private String password;
    private String role;
    private String firstName;
    private String lastName;
    private Boolean generatePassword;
    private Boolean sendEmail;
}
