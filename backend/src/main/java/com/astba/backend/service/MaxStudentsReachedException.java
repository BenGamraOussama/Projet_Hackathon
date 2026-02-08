package com.astba.backend.service;

public class MaxStudentsReachedException extends RuntimeException {
    public MaxStudentsReachedException(String message) {
        super(message);
    }
}
