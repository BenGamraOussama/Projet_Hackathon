package com.astba.backend.service;

import com.astba.backend.dto.JobApplicationDecisionResponse;
import com.astba.backend.dto.JobApplicationFilterRequest;
import com.astba.backend.dto.JobApplicationMatchResponse;
import com.astba.backend.dto.UserResponse;
import com.astba.backend.entity.User;
import com.astba.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class JobApplicationService {
    private final UserRepository userRepository;
    private final UserApprovalService userApprovalService;
    private final EmailService emailService;
    private final AiFilteringClient aiFilteringClient;

    public JobApplicationService(UserRepository userRepository,
            UserApprovalService userApprovalService,
            EmailService emailService,
            AiFilteringClient aiFilteringClient) {
        this.userRepository = userRepository;
        this.userApprovalService = userApprovalService;
        this.emailService = emailService;
        this.aiFilteringClient = aiFilteringClient;
    }

    public List<JobApplicationMatchResponse> filter(JobApplicationFilterRequest request) {
        String normalizedRole = normalizeRole(request != null ? request.getRole() : null);
        double minScore = request != null && request.getMinScore() != null ? request.getMinScore() : 0.3;
        String adminChoice = request != null ? request.getAdminChoice() : null;

        List<User> pending = loadPendingApplications(normalizedRole);
        if (adminChoice == null || adminChoice.isBlank()) {
            return pending.stream()
                    .map(user -> new JobApplicationMatchResponse(user, 1.0, true))
                    .collect(Collectors.toList());
        }
        Map<Long, AiFilteringClient.AiResult> scores =
                aiFilteringClient.score(adminChoice, normalizedRole, minScore, pending);

        List<JobApplicationMatchResponse> responses = new ArrayList<>();
        for (User user : pending) {
            AiFilteringClient.AiResult result = scores.get(user.getId());
            if (result == null) {
                continue;
            }
            if (!result.matched) {
                continue;
            }
            responses.add(new JobApplicationMatchResponse(user, result.score, result.matched));
        }

        responses.sort(Comparator.comparingDouble(JobApplicationMatchResponse::getScore).reversed());
        return responses;
    }

    public JobApplicationDecisionResponse approve(Long id) {
        User user = findJobApplicant(id);
        UserApprovalResult result = userApprovalService.updateStatus(user, "APPROVED", true);
        boolean emailSent = false;
        String emailError = null;
        if (result.getTemporaryPassword() != null) {
            try {
                emailService.sendLoginEmail(result.getUser(), result.getTemporaryPassword());
                emailSent = true;
            } catch (Exception ex) {
                emailError = ex.getMessage();
            }
        }
        String message = emailSent ? "Demande approuvée. Email envoyé." : "Demande approuvée. Email non envoyé.";
        return new JobApplicationDecisionResponse(new UserResponse(result.getUser()), emailSent, emailError, message);
    }

    public JobApplicationDecisionResponse reject(Long id) {
        User user = findJobApplicant(id);
        UserApprovalResult result = userApprovalService.updateStatus(user, "REJECTED", false);
        return new JobApplicationDecisionResponse(new UserResponse(result.getUser()), false, null, "Demande rejetée.");
    }

    private List<User> loadPendingApplications(String role) {
        List<User> pending = userRepository.findByStatus("PENDING");
        return pending.stream()
                .filter(user -> isJobRole(user.getRole()))
                .filter(user -> role == null || role.isBlank() || role.equalsIgnoreCase(user.getRole()))
                .collect(Collectors.toList());
    }

    private User findJobApplicant(Long id) {
        if (id == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User id is required");
        }
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (!isJobRole(user.getRole())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Not a job application");
        }
        return user;
    }

    private boolean isJobRole(String role) {
        if (role == null) {
            return false;
        }
        String normalized = role.trim().toUpperCase(Locale.ROOT);
        return "FORMATEUR".equals(normalized) || "RESPONSABLE".equals(normalized);
    }

    private String normalizeRole(String role) {
        if (role == null || role.isBlank()) {
            return null;
        }
        String normalized = role.trim().toUpperCase(Locale.ROOT);
        if (!"FORMATEUR".equals(normalized) && !"RESPONSABLE".equals(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid role");
        }
        return normalized;
    }
}

