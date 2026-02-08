package com.astba.backend.dto;

import lombok.Data;

@Data
public class UpdateUserStatusRequest {
    private String status; // APPROVED or REJECTED
}
