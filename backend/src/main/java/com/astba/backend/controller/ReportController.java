package com.astba.backend.controller;

import com.astba.backend.dto.ReportSummaryResponse;
import com.astba.backend.service.ReportService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('ADMIN','RESPONSABLE')")
    public ReportSummaryResponse getSummary() {
        return reportService.buildSummary();
    }
}
