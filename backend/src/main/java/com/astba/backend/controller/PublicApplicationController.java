package com.astba.backend.controller;

import com.astba.backend.dto.ApplicationResponse;
import com.astba.backend.dto.JobApplicationRequest;
import com.astba.backend.dto.StudentSignupRequest;
import com.astba.backend.service.ApplicationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/public")
public class PublicApplicationController {
    private final ApplicationService applicationService;

    public PublicApplicationController(ApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    @PostMapping("/job-application")
    public ResponseEntity<?> submitJobApplication(@RequestBody JobApplicationRequest request) {
        try {
            ApplicationResponse response = applicationService.submitJobApplication(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(409).body(ex.getMessage());
        }
    }

    @PostMapping("/student-signup")
    public ResponseEntity<?> submitStudentSignup(@RequestBody StudentSignupRequest request) {
        try {
            ApplicationResponse response = applicationService.submitStudentSignup(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(409).body(ex.getMessage());
        }
    }
}
