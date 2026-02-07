package com.astba.backend.dto;

import lombok.Data;

@Data
public class UserCreateResponse {
    private UserResponse user;
    private String temporaryPassword;
    private boolean emailSent;
    private String emailError;

    public UserCreateResponse(UserResponse user, String temporaryPassword, boolean emailSent, String emailError) {
        this.user = user;
        this.temporaryPassword = temporaryPassword;
        this.emailSent = emailSent;
        this.emailError = emailError;
    }
}
