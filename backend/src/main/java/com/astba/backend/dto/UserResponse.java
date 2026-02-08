package com.astba.backend.dto;

import com.astba.backend.entity.User;
import lombok.Data;

@Data
public class UserResponse {
    private Long id;
    private String email;
    private String role;
    private String firstName;
    private String lastName;
    private String status;
    private String phone;
    private String address;
    private String careerDescription;

    public UserResponse(User user) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.role = user.getRole();
        this.firstName = user.getFirstName();
        this.lastName = user.getLastName();
        this.status = user.getStatus();
        this.phone = user.getPhone();
        this.address = user.getAddress();
        this.careerDescription = user.getCareerDescription();
    }
}
