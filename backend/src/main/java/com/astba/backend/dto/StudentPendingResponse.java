package com.astba.backend.dto;

import com.astba.backend.entity.Student;
import lombok.Data;

import java.time.LocalDate;

@Data
public class StudentPendingResponse {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String gender;
    private LocalDate birthDate;
    private String address;
    private String status;

    public StudentPendingResponse(Student student) {
        this.id = student.getId();
        this.firstName = student.getFirstName();
        this.lastName = student.getLastName();
        this.email = student.getEmail();
        this.phone = student.getPhone();
        this.gender = student.getGender();
        this.birthDate = student.getBirthDate();
        this.address = student.getAddress();
        this.status = student.getStatus();
    }
}
