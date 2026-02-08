package com.astba.backend.controller;

import com.astba.backend.dto.JobApplicationDecisionResponse;
import com.astba.backend.dto.JobApplicationFilterRequest;
import com.astba.backend.dto.JobApplicationMatchResponse;
import com.astba.backend.service.JobApplicationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/job-applications")
public class JobApplicationController {
    private final JobApplicationService jobApplicationService;

    public JobApplicationController(JobApplicationService jobApplicationService) {
        this.jobApplicationService = jobApplicationService;
    }

    @PostMapping("/filter")
    @PreAuthorize("hasRole('ADMIN')")
    public List<JobApplicationMatchResponse> filter(@RequestBody JobApplicationFilterRequest request) {
        return jobApplicationService.filter(request);
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<JobApplicationDecisionResponse> approve(@PathVariable Long id) {
        return ResponseEntity.ok(jobApplicationService.approve(id));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<JobApplicationDecisionResponse> reject(@PathVariable Long id) {
        return ResponseEntity.ok(jobApplicationService.reject(id));
    }
}

