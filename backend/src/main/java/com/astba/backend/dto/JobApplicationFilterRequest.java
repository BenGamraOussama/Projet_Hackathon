package com.astba.backend.dto;

import lombok.Data;

@Data
public class JobApplicationFilterRequest {
    private String role;
    private String adminChoice;
    private Double minScore;
}

