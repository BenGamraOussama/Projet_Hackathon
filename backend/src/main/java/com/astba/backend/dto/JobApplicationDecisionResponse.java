package com.astba.backend.dto;

import lombok.Data;

@Data
public class JobApplicationDecisionResponse {
    private UserResponse user;
    private boolean emailSent;
    private String emailError;
    private String message;

    public JobApplicationDecisionResponse(UserResponse user, boolean emailSent, String emailError, String message) {
        this.user = user;
        this.emailSent = emailSent;
        this.emailError = emailError;
        this.message = message;
    }
}

