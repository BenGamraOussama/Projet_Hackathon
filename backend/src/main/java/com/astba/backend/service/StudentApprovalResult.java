package com.astba.backend.service;

import com.astba.backend.entity.Student;

public class StudentApprovalResult {
    private final Student student;
    private final String temporaryPassword;

    public StudentApprovalResult(Student student, String temporaryPassword) {
        this.student = student;
        this.temporaryPassword = temporaryPassword;
    }

    public Student getStudent() {
        return student;
    }

    public String getTemporaryPassword() {
        return temporaryPassword;
    }
}
