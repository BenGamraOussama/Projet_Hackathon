package com.astba.backend.service;

import com.astba.backend.entity.User;

public class UserApprovalResult {
    private final User user;
    private final String temporaryPassword;

    public UserApprovalResult(User user, String temporaryPassword) {
        this.user = user;
        this.temporaryPassword = temporaryPassword;
    }

    public User getUser() {
        return user;
    }

    public String getTemporaryPassword() {
        return temporaryPassword;
    }
}
