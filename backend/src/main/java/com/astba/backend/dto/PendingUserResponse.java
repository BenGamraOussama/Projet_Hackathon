package com.astba.backend.dto;

import com.astba.backend.entity.User;
import lombok.Data;

import java.time.LocalDate;

@Data
public class PendingUserResponse {
    private Long id;
    private String email;
    private String role;
    private String firstName;
    private String lastName;
    private String status;
    private String gender;
    private LocalDate birthDate;
    private String phone;
    private String address;
    private String careerDescription;

    public PendingUserResponse(User user) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.role = user.getRole();
        this.firstName = user.getFirstName();
        this.lastName = user.getLastName();
        this.status = user.getStatus();
        this.gender = user.getGender();
        this.birthDate = user.getBirthDate();
        this.phone = user.getPhone();
        this.address = user.getAddress();
        this.careerDescription = user.getCareerDescription();
    }
}
