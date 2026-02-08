package com.astba.backend.dto;

import lombok.Data;

@Data
public class ApplicationResponse {
    private Long userId;
    private String status;
    private String message;

    public ApplicationResponse(Long userId, String status, String message) {
        this.userId = userId;
        this.status = status;
        this.message = message;
    }
}
