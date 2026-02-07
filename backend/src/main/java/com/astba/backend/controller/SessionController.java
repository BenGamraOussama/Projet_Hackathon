package com.astba.backend.controller;

import com.astba.backend.dto.SessionScheduleUpdateRequest;
import com.astba.backend.entity.Level;
import com.astba.backend.entity.Session;
import com.astba.backend.entity.Training;
import com.astba.backend.entity.TrainingCreationMode;
import com.astba.backend.exception.ApiException;
import com.astba.backend.repository.LevelRepository;
import com.astba.backend.repository.SessionRepository;
import com.astba.backend.repository.TrainingRepository;
import com.astba.backend.service.AuditService;
import com.astba.backend.service.TrainingStructureService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.Objects;
import java.util.List;

@RestController
@RequestMapping("/api/sessions")
@Tag(name = "Sessions")
public class SessionController {

    private final SessionRepository sessionRepository;
    private final TrainingRepository trainingRepository;
    private final LevelRepository levelRepository;
    private final TrainingStructureService trainingStructureService;
    private final AuditService auditService;

    public SessionController(SessionRepository sessionRepository,
            TrainingRepository trainingRepository,
            LevelRepository levelRepository,
            TrainingStructureService trainingStructureService,
            AuditService auditService) {
        this.sessionRepository = sessionRepository;
        this.trainingRepository = trainingRepository;
        this.levelRepository = levelRepository;
        this.trainingStructureService = trainingStructureService;
        this.auditService = auditService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','RESPONSABLE','FORMATEUR')")
    public List<Session> getSessions(@RequestParam(required = false) @Nullable Long trainingId,
            @RequestParam(required = false) @Nullable Integer levelNumber) {
        if (trainingId != null && levelNumber != null) {
            return sessionRepository.findByTrainingIdAndLevelNumber(trainingId, levelNumber);
        }
        if (trainingId != null) {
            return sessionRepository.findByTrainingId(trainingId);
        }
        return sessionRepository.findAll();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','RESPONSABLE')")
    public ResponseEntity<?> createSession(@RequestBody Session session) {
        if (session == null || session.getTraining() == null || session.getTraining().getId() == null) {
            return ResponseEntity.badRequest().body("Training is required");
        }
        Long trainingId = Objects.requireNonNull(session.getTraining().getId(), "trainingId");
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
        Integer levelNumber = session.getLevelNumber();
        if (levelNumber == null) {
            return ResponseEntity.badRequest().body("Level number is required");
        }
        Integer sessionNumber = session.getSessionNumber();
        if (sessionNumber == null
                || sessionNumber < 1
                || sessionNumber > trainingStructureService.getDefaultSessionsPerLevel()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "SESSION_INDEX_INVALID",
                    "Session index must be between 1 and 6");
        }
        Level level = levelRepository.findByTrainingIdAndLevelNumber(trainingId, levelNumber)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "LEVEL_NOT_FOUND",
                        "Level not found"));
        session.setTraining(training);
        session.setLevel(level);
        session.setLevelNumber(levelNumber);
        session.setSessionNumber(sessionNumber);
        if (session.getTitle() == null || session.getTitle().isBlank()) {
            session.setTitle("Level " + levelNumber + " - Session " + sessionNumber);
        }
        if (session.getDurationMin() == null) {
            session.setDurationMin(120);
        }
        if (session.getStatus() == null || session.getStatus().isBlank()) {
            session.setStatus("PLANNED");
        }
        Session saved = sessionRepository.save(session);
        auditService.log("SESSION_CREATED", "Session", String.valueOf(saved.getId()),
                "Session created for level " + level.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{sessionId}")
    @PreAuthorize("hasAnyRole('ADMIN','RESPONSABLE')")
    public ResponseEntity<Session> updateSchedule(@PathVariable @NonNull Long sessionId,
            @RequestBody @NonNull SessionScheduleUpdateRequest request) {
        return sessionRepository.findById(sessionId)
                .map((@NonNull Session session) -> {
                    if (request.getStartAt() != null) {
                        session.setStartAt(request.getStartAt());
                    }
                    if (request.getDurationMin() != null) {
                        session.setDurationMin(request.getDurationMin());
                    }
                    if (request.getLocation() != null) {
                        session.setLocation(request.getLocation());
                    }
                    if (request.getStatus() != null) {
                        session.setStatus(request.getStatus());
                    }
                    Session saved = sessionRepository.save(session);
                    auditService.log("SESSION_SCHEDULE_UPDATED", "Session", String.valueOf(saved.getId()),
                            "Session schedule updated");
                    return ResponseEntity.ok(saved);
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
