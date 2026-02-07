package com.astba.backend.exception;

import com.astba.backend.dto.ApiError;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiError> handleApiException(@NonNull ApiException ex) {
        ApiError error = new ApiError(ex.getCode(), ex.getMessage());
        return ResponseEntity.status(ex.getStatus()).body(error);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiError> handleDataIntegrity(@NonNull DataIntegrityViolationException ex) {
        String message = ex.getMostSpecificCause() != null
                ? ex.getMostSpecificCause().getMessage()
                : ex.getMessage();
        String code = "DATA_INTEGRITY_VIOLATION";
        if (message != null) {
            if (message.contains("uk_level_training_level_number")) {
                code = "LEVEL_ALREADY_EXISTS";
            } else if (message.contains("uk_session_level_session_number")) {
                code = "SESSION_ALREADY_EXISTS";
            }
        }
        ApiError error = new ApiError(code, "Unique constraint violated");
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }
}
