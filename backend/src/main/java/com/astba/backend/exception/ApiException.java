package com.astba.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;

public class ApiException extends RuntimeException {
    private final @NonNull HttpStatus status;
    private final @NonNull String code;

    public ApiException(@NonNull HttpStatus status, @NonNull String code, String message) {
        super(message);
        this.status = status;
        this.code = code;
    }

    public @NonNull HttpStatus getStatus() {
        return status;
    }

    public @NonNull String getCode() {
        return code;
    }
}
