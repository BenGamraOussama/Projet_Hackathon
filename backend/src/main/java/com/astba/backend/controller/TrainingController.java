package com.astba.backend.controller;

import com.astba.backend.dto.LevelCreateRequest;
import com.astba.backend.dto.LevelDetailResponse;
import com.astba.backend.dto.TrainingCreateRequest;
import com.astba.backend.dto.TrainingDetailResponse;
import com.astba.backend.entity.Level;
import com.astba.backend.entity.Training;
import com.astba.backend.entity.TrainingCreationMode;
import com.astba.backend.entity.TrainingStructureStatus;
import com.astba.backend.exception.ApiException;
import com.astba.backend.repository.LevelRepository;
import com.astba.backend.repository.TrainingRepository;
import com.astba.backend.service.AuditService;
import com.astba.backend.service.TrainingDetailMapper;
import com.astba.backend.service.TrainingStructureService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Objects;

@RestController
@RequestMapping("/api/trainings")
@Tag(name = "Trainings")
public class TrainingController {

    private final TrainingRepository trainingRepository;
    private final LevelRepository levelRepository;
    private final TrainingStructureService trainingStructureService;
    private final AuditService auditService;
    private final TrainingDetailMapper trainingDetailMapper;

    public TrainingController(TrainingRepository trainingRepository,
            LevelRepository levelRepository,
            TrainingStructureService trainingStructureService,
            AuditService auditService,
            TrainingDetailMapper trainingDetailMapper) {
        this.trainingRepository = trainingRepository;
        this.levelRepository = levelRepository;
        this.trainingStructureService = trainingStructureService;
        this.auditService = auditService;
        this.trainingDetailMapper = trainingDetailMapper;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','RESPONSABLE','FORMATEUR')")
    public List<Training> getAllTrainings() {
        return trainingRepository.findAll();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','RESPONSABLE','FORMATEUR')")
    @Operation(summary = "Get training detail with levels and sessions")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Training found",
                    content = @Content(schema = @Schema(implementation = TrainingDetailResponse.class))),
            @ApiResponse(responseCode = "404", description = "Training not found")
    })
    public ResponseEntity<TrainingDetailResponse> getTrainingDetail(@PathVariable @NonNull Long id) {
        return trainingRepository.findById(id)
                .map(training -> ResponseEntity.ok(trainingDetailMapper.buildDetail(training)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','RESPONSABLE')")
    @Operation(summary = "Create training with creation mode")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Training created",
                    content = @Content(schema = @Schema(implementation = TrainingDetailResponse.class))),
            @ApiResponse(responseCode = "400", description = "Validation failed")
    })
    public ResponseEntity<TrainingDetailResponse> createTraining(@Valid @RequestBody TrainingCreateRequest request) {
        validateCounts(request.getLevelsCount(), request.getSessionsPerLevel());
        Training training = new Training();
        training.setName(request.getTitle());
        training.setDescription(request.getDescription());
        training.setCreationMode(request.getCreationMode());
        training.setStructureStatus(TrainingStructureStatus.NOT_GENERATED);
        training.setStartDate(request.getStartDate());
        training.setEndDate(request.getEndDate());
        training.setStatus(request.getStatus());
        Training saved = trainingRepository.save(training);
        auditService.log("TRAINING_CREATED", "Training", String.valueOf(saved.getId()), "Training created");
        return ResponseEntity.status(HttpStatus.CREATED).body(trainingDetailMapper.buildDetail(saved));
    }

    @PostMapping("/{id}/generate-structure")
    @PreAuthorize("hasAnyRole('ADMIN','RESPONSABLE')")
    @Operation(summary = "Generate structure for AUTO trainings")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Structure generated or already exists"),
            @ApiResponse(responseCode = "404", description = "Training not found"),
            @ApiResponse(responseCode = "409", description = "Conflict (mode/locked)")
    })
    public ResponseEntity<TrainingDetailResponse> generateStructure(@PathVariable @NonNull Long id) {
        Training training = trainingRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "TRAINING_NOT_FOUND",
                        "Training not found"));
        if (training.getCreationMode() != TrainingCreationMode.AUTO) {
            throw new ApiException(HttpStatus.CONFLICT, "CREATION_MODE_MANUAL",
                    "Training creation mode is MANUAL");
        }
        if (trainingStructureService.isStructureLocked(training)) {
            auditService.log("STRUCTURE_LOCKED_VIOLATION", "Training", String.valueOf(training.getId()),
                    "Structure update blocked due to attendance");
            throw new ApiException(HttpStatus.CONFLICT, "STRUCTURE_LOCKED", "Structure is locked");
        }
        if (!trainingStructureService.hasGeneratedStructure(training)) {
            trainingStructureService.generateStructure(training,
                    trainingStructureService.getDefaultLevelsCount(),
                    trainingStructureService.getDefaultSessionsPerLevel());
            training.setStructureStatus(TrainingStructureStatus.GENERATED);
            trainingRepository.save(training);
            auditService.log("STRUCTURE_GENERATED", "Training", String.valueOf(training.getId()),
                    "Structure generated");
        }
        return ResponseEntity.ok(trainingDetailMapper.buildDetail(training));
    }

    @PostMapping("/{id}/levels")
    @PreAuthorize("hasAnyRole('ADMIN','RESPONSABLE')")
    @Operation(summary = "Create manual level")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Level created"),
            @ApiResponse(responseCode = "404", description = "Training not found"),
            @ApiResponse(responseCode = "409", description = "Conflict (mode/locked/duplicate)")
    })
    public ResponseEntity<LevelDetailResponse> createManualLevel(@PathVariable @NonNull Long id,
            @Valid @RequestBody @NonNull LevelCreateRequest request) {
        Training training = trainingRepository.findById(id)
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
        Integer levelIndex = request.getLevelIndex();
        if (levelIndex == null || levelIndex < 1 || levelIndex > trainingStructureService.getDefaultLevelsCount()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "LEVEL_INDEX_INVALID",
                    "Level index must be between 1 and 4");
        }

        Level level = new Level();
        level.setTraining(training);
        level.setLevelNumber(levelIndex);
        level.setName(request.getTitle() != null ? request.getTitle() : "Level " + levelIndex);
        level.setDescription(request.getDescription());
        Level saved = levelRepository.save(level);
        if (training.getStructureStatus() != TrainingStructureStatus.GENERATED) {
            training.setStructureStatus(TrainingStructureStatus.GENERATED);
            trainingRepository.save(training);
        }
        auditService.log("LEVEL_CREATED", "Level", String.valueOf(saved.getId()),
                "Level created for training " + training.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(trainingDetailMapper.toLevelDetail(saved, List.of()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','RESPONSABLE')")
    public ResponseEntity<Training> updateTraining(@PathVariable @NonNull Long id, @RequestBody @NonNull Training updated) {
        if (id == null || updated == null) {
            return ResponseEntity.badRequest().build();
        }
        return trainingRepository.findById(id)
                .map(existing -> {
                    existing.setName(updated.getName());
                    existing.setDescription(updated.getDescription());
                    existing.setStartDate(updated.getStartDate());
                    existing.setEndDate(updated.getEndDate());
                    existing.setStatus(updated.getStatus());
                    return ResponseEntity.ok(trainingRepository.save(existing));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    private void validateCounts(Integer levelsCount, Integer sessionsPerLevel) {
        if (!Objects.equals(levelsCount, trainingStructureService.getDefaultLevelsCount())
                || !Objects.equals(sessionsPerLevel, trainingStructureService.getDefaultSessionsPerLevel())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "STRUCTURE_COUNTS_INVALID",
                    "Levels must be 4 and sessions per level must be 6");
        }
    }

}
