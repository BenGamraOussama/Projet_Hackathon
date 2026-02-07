package com.astba.backend.controller;

import com.astba.backend.dto.AiPlanApplyRequest;
import com.astba.backend.dto.AiPlanRequest;
import com.astba.backend.dto.AiPlanResponse;
import com.astba.backend.dto.TrainingDetailResponse;
import com.astba.backend.entity.Training;
import com.astba.backend.exception.ApiException;
import com.astba.backend.repository.TrainingRepository;
import com.astba.backend.service.AiTrainingPlanService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.Objects;

@RestController
@RequestMapping("/api/trainings")
@Tag(name = "AI Training Plan")
public class AiTrainingPlanController {
    private final TrainingRepository trainingRepository;
    private final AiTrainingPlanService aiTrainingPlanService;

    public AiTrainingPlanController(TrainingRepository trainingRepository,
            AiTrainingPlanService aiTrainingPlanService) {
        this.trainingRepository = trainingRepository;
        this.aiTrainingPlanService = aiTrainingPlanService;
    }

    @PostMapping("/{id}/ai-plan")
    @PreAuthorize("hasRole('RESPONSABLE')")
    @Operation(summary = "Generate AI draft plan (AUTO only)")
    public ResponseEntity<AiPlanResponse> generatePlan(@PathVariable @NonNull Long id,
            @Valid @RequestBody @NonNull AiPlanRequest request,
            @Nullable Authentication authentication) {
        Training training = getTrainingOrThrow(id);
        String actor = authentication != null ? authentication.getName() : "unknown";
        return ResponseEntity.ok(new AiPlanResponse(aiTrainingPlanService.generateDraftPlan(training, request, actor)));
    }

    @PostMapping("/{id}/apply-ai-plan")
    @PreAuthorize("hasRole('RESPONSABLE')")
    @Operation(summary = "Apply AI draft plan (AUTO only)")
    public ResponseEntity<TrainingDetailResponse> applyPlan(@PathVariable @NonNull Long id,
            @Valid @RequestBody @NonNull AiPlanApplyRequest request) {
        Training training = getTrainingOrThrow(id);
        Training updated = aiTrainingPlanService.applyPlan(training,
                Objects.requireNonNull(request.getApprovedPlan(), "approvedPlan"));
        return ResponseEntity.ok(aiTrainingPlanService.buildDetail(updated));
    }

    private Training getTrainingOrThrow(@NonNull Long id) {
        return trainingRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "TRAINING_NOT_FOUND", "Training not found"));
    }
}
