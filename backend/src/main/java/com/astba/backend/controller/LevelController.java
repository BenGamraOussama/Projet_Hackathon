package com.astba.backend.controller;

import com.astba.backend.dto.SessionCreateRequest;
import com.astba.backend.entity.Level;
import com.astba.backend.entity.Session;
import com.astba.backend.entity.Training;
import com.astba.backend.entity.TrainingCreationMode;
import com.astba.backend.entity.TrainingStructureStatus;
import com.astba.backend.exception.ApiException;
import com.astba.backend.repository.LevelRepository;
import com.astba.backend.repository.SessionRepository;
import com.astba.backend.repository.TrainingRepository;
import com.astba.backend.service.AuditService;
import com.astba.backend.service.TrainingStructureService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.Objects;
import java.util.List;

@RestController
@RequestMapping("/api/levels")
@Tag(name = "Levels")
public class LevelController {

    private final LevelRepository levelRepository;
    private final TrainingRepository trainingRepository;
    private final SessionRepository sessionRepository;
    private final TrainingStructureService trainingStructureService;
    private final AuditService auditService;

    public LevelController(LevelRepository levelRepository,
            TrainingRepository trainingRepository,
            SessionRepository sessionRepository,
            TrainingStructureService trainingStructureService,
            AuditService auditService) {
        this.levelRepository = levelRepository;
        this.trainingRepository = trainingRepository;
        this.sessionRepository = sessionRepository;
        this.trainingStructureService = trainingStructureService;
        this.auditService = auditService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','RESPONSABLE','FORMATEUR')")
    public List<Level> getLevels(@RequestParam(required = false) @Nullable Long trainingId) {
        if (trainingId != null) {
            return levelRepository.findByTrainingId(trainingId);
        }
        return levelRepository.findAll();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','RESPONSABLE')")
    public ResponseEntity<?> createLevel(@RequestBody Level level) {
        if (level == null || level.getTraining() == null || level.getTraining().getId() == null) {
            return ResponseEntity.badRequest().body("Training is required");
        }
        if (level.getLevelNumber() == null
                || level.getLevelNumber() < 1
                || level.getLevelNumber() > trainingStructureService.getDefaultLevelsCount()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "LEVEL_INDEX_INVALID",
                    "Level index must be between 1 and 4");
        }
        Long trainingId = Objects.requireNonNull(level.getTraining().getId(), "trainingId");
        Training training = trainingRepository.findById(trainingId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "TRAINING_NOT_FOUND",
                        "Training not found"));
        if (training.getCreationMode() != TrainingCreationMode.MANUAL) {
            throw new ApiException(HttpStatus.CONFLICT, "CREATION_MODE_AUTO",
                    "Training creation mode is AUTO");
        }
        if (trainingStructureService.isStructureLocked(training)) {
            auditService.log("STRUCTURE_LOCKED_VIOLATION", "Training", String.valueOf(training.getId()),
                    "Structure update blocked due to attendance");
            throw new ApiException(HttpStatus.CONFLICT, "STRUCTURE_LOCKED", "Structure is locked");
        }
        if (level.getName() == null || level.getName().isBlank()) {
            level.setName("Level " + level.getLevelNumber());
        }
        level.setTraining(training);
        Level saved = levelRepository.save(level);
        if (training.getStructureStatus() != TrainingStructureStatus.GENERATED) {
            training.setStructureStatus(TrainingStructureStatus.GENERATED);
            trainingRepository.save(training);
        }
        auditService.log("LEVEL_CREATED", "Level", String.valueOf(saved.getId()),
                "Level created for training " + training.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PostMapping("/{levelId}/sessions")
    @PreAuthorize("hasAnyRole('ADMIN','RESPONSABLE')")
    public ResponseEntity<Session> createManualSession(@PathVariable @NonNull Long levelId,
            @Valid @RequestBody @NonNull SessionCreateRequest request) {
        Level level = levelRepository.findById(levelId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "LEVEL_NOT_FOUND", "Level not found"));
        Training training = level.getTraining();
        if (training == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "TRAINING_NOT_FOUND", "Training not found");
        }
        if (training.getCreationMode() != TrainingCreationMode.MANUAL) {
            throw new ApiException(HttpStatus.CONFLICT, "CREATION_MODE_AUTO",
                    "Training creation mode is AUTO");
        }
        if (trainingStructureService.isStructureLocked(training)) {
            auditService.log("STRUCTURE_LOCKED_VIOLATION", "Training", String.valueOf(training.getId()),
                    "Structure update blocked due to attendance");
            throw new ApiException(HttpStatus.CONFLICT, "STRUCTURE_LOCKED", "Structure is locked");
        }
        Integer sessionIndex = request.getSessionIndex();
        if (sessionIndex == null || sessionIndex < 1 || sessionIndex > trainingStructureService.getDefaultSessionsPerLevel()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "SESSION_INDEX_INVALID",
                    "Session index must be between 1 and 6");
        }

        Session session = new Session();
        session.setTraining(training);
        session.setLevel(level);
        session.setLevelNumber(level.getLevelNumber());
        session.setSessionNumber(sessionIndex);
        session.setTitle(request.getTitle() != null
                ? request.getTitle()
                : "Level " + level.getLevelNumber() + " - Session " + sessionIndex);
        session.setStartAt(request.getStartAt());
        session.setDurationMin(request.getDurationMin() != null ? request.getDurationMin() : 120);
        session.setLocation(request.getLocation());
        session.setStatus(request.getStatus() != null ? request.getStatus() : "PLANNED");
        Session saved = sessionRepository.save(session);
        auditService.log("SESSION_CREATED", "Session", String.valueOf(saved.getId()),
                "Session created for level " + level.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }
}
