package com.astba.backend.dto;

import lombok.Data;

@Data
public class JwtAuthenticationResponse {
    private String accessToken;
    private String tokenType = "Bearer";
    private UserResponse user;

    public JwtAuthenticationResponse(String accessToken, UserResponse user) {
        this.accessToken = accessToken;
        this.user = user;
    }
}
