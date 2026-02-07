package com.astba.backend.controller;

import com.astba.backend.entity.AuditLog;
import com.astba.backend.repository.AuditLogRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/audit-logs")
public class AuditLogController {

    private final AuditLogRepository auditLogRepository;

    public AuditLogController(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<AuditLog> getLatestLogs() {
        return auditLogRepository.findTop100ByOrderByCreatedAtDesc();
    }
}
