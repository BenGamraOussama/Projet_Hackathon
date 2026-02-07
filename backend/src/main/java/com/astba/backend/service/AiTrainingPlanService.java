package com.astba.backend.service;

import com.astba.backend.dto.AiPlanConstraints;
import com.astba.backend.dto.AiPlanRequest;
import com.astba.backend.entity.Level;
import com.astba.backend.entity.Session;
import com.astba.backend.entity.Training;
import com.astba.backend.entity.TrainingCreationMode;
import com.astba.backend.entity.TrainingStructureStatus;
import com.astba.backend.exception.ApiException;
import com.astba.backend.repository.LevelRepository;
import com.astba.backend.repository.SessionRepository;
import com.astba.backend.repository.TrainingRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.lang.NonNull;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class AiTrainingPlanService {
    private static final int MAX_PROMPT_LENGTH = 2000;

    private final AiPlanSchemaValidator schemaValidator;
    private final AiPromptTemplateService promptTemplateService;
    private final MistralLlmClient mistralClient;
    private final AiRateLimiter rateLimiter;
    private final TrainingStructureService trainingStructureService;
    private final TrainingRepository trainingRepository;
    private final LevelRepository levelRepository;
    private final SessionRepository sessionRepository;
    private final TrainingDetailMapper trainingDetailMapper;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;

    public AiTrainingPlanService(AiPlanSchemaValidator schemaValidator,
            AiPromptTemplateService promptTemplateService,
            MistralLlmClient mistralClient,
            AiRateLimiter rateLimiter,
            TrainingStructureService trainingStructureService,
            TrainingRepository trainingRepository,
            LevelRepository levelRepository,
            SessionRepository sessionRepository,
            TrainingDetailMapper trainingDetailMapper,
            AuditService auditService,
            ObjectMapper objectMapper) {
        this.schemaValidator = schemaValidator;
        this.promptTemplateService = promptTemplateService;
        this.mistralClient = mistralClient;
        this.rateLimiter = rateLimiter;
        this.trainingStructureService = trainingStructureService;
        this.trainingRepository = trainingRepository;
        this.levelRepository = levelRepository;
        this.sessionRepository = sessionRepository;
        this.trainingDetailMapper = trainingDetailMapper;
        this.auditService = auditService;
        this.objectMapper = objectMapper;
    }

    public JsonNode generateDraftPlan(@NonNull Training training, @NonNull AiPlanRequest request, String actor) {
        ensureAutoMode(training);
        validatePrompt(request.getPromptText());
        validateLanguage(request.getLanguage());
        rateLimiter.assertAllowed(actor);

        String constraintsJson = toConstraintsJson(request.getConstraints());
        String systemPrompt = promptTemplateService.getSystemPrompt();
        String userPrompt = promptTemplateService.buildUserPrompt(
                request.getPromptText(),
                constraintsJson,
                request.getLanguage());
        String raw = mistralClient.requestPlanJson(
                systemPrompt,
                userPrompt,
                schemaValidator.getSchemaNode(),
                request.getLanguage(),
                request.getPromptText(),
                request.getConstraints());

        JsonNode planNode = parseStrictJson(raw);
        List<String> errors = schemaValidator.validate(planNode);
        if (!errors.isEmpty()) {
            String repairPrompt = promptTemplateService.getRepairPrompt();
            String repairUserPrompt = promptTemplateService.buildRepairUserPrompt(String.join("\n", errors), raw);
            String repaired = mistralClient.requestPlanJson(
                    repairPrompt,
                    repairUserPrompt,
                    schemaValidator.getSchemaNode(),
                    request.getLanguage(),
                    request.getPromptText(),
                    request.getConstraints());
            planNode = parseStrictJson(repaired);
            errors = schemaValidator.validate(planNode);
            if (!errors.isEmpty()) {
                throw new ApiException(HttpStatus.BAD_GATEWAY, "AI_PLAN_INVALID_OUTPUT",
                        "AI output did not match schema");
            }
        }

        auditService.log("AI_PLAN_REQUESTED", "Training", String.valueOf(training.getId()),
                "AI plan requested (language=" + request.getLanguage() + ")");
        return planNode;
    }

    @Transactional
    public Training applyPlan(@NonNull Training training, @NonNull JsonNode approvedPlan) {
        ensureAutoMode(training);
        List<String> errors = schemaValidator.validate(approvedPlan);
        if (!errors.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "AI_PLAN_INVALID_OUTPUT",
                    "Plan validation failed");
        }

        if (!trainingStructureService.hasGeneratedStructure(training)) {
            if (trainingStructureService.isStructureLocked(training)) {
                auditService.log("STRUCTURE_LOCKED_VIOLATION", "Training", String.valueOf(training.getId()),
                        "AI plan apply blocked due to attendance");
                throw new ApiException(HttpStatus.CONFLICT, "STRUCTURE_LOCKED",
                        "Structure is locked");
            }
            trainingStructureService.generateStructure(training,
                    trainingStructureService.getDefaultLevelsCount(),
                    trainingStructureService.getDefaultSessionsPerLevel());
            training.setStructureStatus(TrainingStructureStatus.GENERATED);
        }

        JsonNode trainingNode = approvedPlan.get("training");
        if (trainingNode != null) {
            training.setName(trainingNode.path("title").asText(training.getName()));
            training.setDescription(trainingNode.path("description").asText(training.getDescription()));
        }
        trainingRepository.save(training);

        List<Level> levels = levelRepository.findByTrainingIdOrderByLevelNumber(training.getId());
        if (levels.size() != trainingStructureService.getDefaultLevelsCount()) {
            throw new ApiException(HttpStatus.CONFLICT, "STRUCTURE_MISSING",
                    "Training structure does not match required level count");
        }

        Map<Integer, Level> levelByIndex = levels.stream()
                .filter(level -> level.getLevelNumber() != null)
                .collect(Collectors.toMap(Level::getLevelNumber, level -> level));
        List<Session> sessions = sessionRepository.findByTrainingId(training.getId());
        Map<Integer, Map<Integer, Session>> sessionsByLevel = sessions.stream()
                .filter(session -> session.getLevelNumber() != null && session.getSessionNumber() != null)
                .collect(Collectors.groupingBy(Session::getLevelNumber,
                        Collectors.toMap(Session::getSessionNumber, session -> session, (a, b) -> a)));

        for (JsonNode levelNode : approvedPlan.path("levels")) {
            int levelIndex = levelNode.path("levelIndex").asInt();
            Level level = levelByIndex.get(levelIndex);
            if (level == null) {
                throw new ApiException(HttpStatus.CONFLICT, "STRUCTURE_MISSING",
                        "Missing level " + levelIndex);
            }
            level.setName(levelNode.path("title").asText(level.getName()));
            level.setDescription(truncate(joinArray(levelNode.path("outcomes")), 1000));

            Map<Integer, Session> sessionMap = sessionsByLevel.get(levelIndex);
            if (sessionMap == null || sessionMap.size() != trainingStructureService.getDefaultSessionsPerLevel()) {
                throw new ApiException(HttpStatus.CONFLICT, "STRUCTURE_MISSING",
                        "Sessions missing for level " + levelIndex);
            }

            for (JsonNode sessionNode : levelNode.path("sessions")) {
                int sessionIndex = sessionNode.path("sessionIndex").asInt();
                Session session = sessionMap.get(sessionIndex);
                if (session == null) {
                    throw new ApiException(HttpStatus.CONFLICT, "STRUCTURE_MISSING",
                            "Missing session " + sessionIndex + " for level " + levelIndex);
                }
                session.setTitle(sessionNode.path("title").asText(session.getTitle()));
                session.setObjective(sessionNode.path("objective").asText(session.getObjective()));
                session.setDurationMin(sessionNode.path("durationMin").asInt(session.getDurationMin() != null ? session.getDurationMin() : 120));
                JsonNode startAtNode = sessionNode.get("startAt");
                session.setStartAt(parseDateTime(startAtNode));
                JsonNode locationNode = sessionNode.get("location");
                session.setLocation(locationNode == null || locationNode.isNull() ? null : locationNode.asText());
                session.setModality(sessionNode.path("modality").asText(session.getModality()));
                session.setMaterials(toJsonOrNull(sessionNode.get("materials")));
                session.setAccessibilityNotes(toJsonOrNull(sessionNode.get("accessibilityNotes")));
            }
        }

        levelRepository.saveAll(levels);
        sessionRepository.saveAll(sessions);

        auditService.log("AI_PLAN_APPLIED", "Training", String.valueOf(training.getId()),
                "AI plan applied");
        return training;
    }

    public com.astba.backend.dto.TrainingDetailResponse buildDetail(Training training) {
        return trainingDetailMapper.buildDetail(training);
    }

    private void ensureAutoMode(Training training) {
        if (training.getCreationMode() != TrainingCreationMode.AUTO) {
            throw new ApiException(HttpStatus.CONFLICT, "CREATION_MODE_MANUAL",
                    "Training creation mode is MANUAL");
        }
    }

    private void validatePrompt(String promptText) {
        if (promptText == null || promptText.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "PROMPT_REQUIRED", "Prompt text is required");
        }
        if (promptText.length() > MAX_PROMPT_LENGTH) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "PROMPT_TOO_LONG",
                    "Prompt text exceeds " + MAX_PROMPT_LENGTH + " characters");
        }
    }

    private void validateLanguage(String language) {
        if (!Objects.equals(language, "fr") && !Objects.equals(language, "ar") && !Objects.equals(language, "en")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "LANGUAGE_INVALID",
                    "Language must be one of: fr, ar, en");
        }
    }

    private String toConstraintsJson(AiPlanConstraints constraints) {
        try {
            if (constraints == null) {
                return "{}";
            }
            return objectMapper.writeValueAsString(constraints);
        } catch (IOException ex) {
            return "{}";
        }
    }

    private JsonNode parseStrictJson(String rawJson) {
        try {
            return schemaValidator.parseJson(rawJson);
        } catch (IOException ex) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "AI_PLAN_INVALID_OUTPUT",
                    "AI output was not valid JSON");
        }
    }

    private LocalDateTime parseDateTime(JsonNode node) {
        if (node == null || node.isNull()) {
            return null;
        }
        String value = node.asText();
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return LocalDateTime.parse(value);
        } catch (Exception ex) {
            try {
                return java.time.OffsetDateTime.parse(value).toLocalDateTime();
            } catch (Exception ignored) {
                return null;
            }
        }
    }

    private String joinArray(JsonNode node) {
        if (node == null || !node.isArray()) {
            return null;
        }
        List<String> values = new java.util.ArrayList<>();
        node.forEach(item -> values.add(item.asText()));
        return String.join("\n", values);
    }

    private String truncate(String value, int maxLength) {
        if (value == null) return null;
        return value.length() <= maxLength ? value : value.substring(0, maxLength);
    }

    private String toJsonOrNull(JsonNode node) {
        if (node == null || node.isNull()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(node);
        } catch (IOException ex) {
            return null;
        }
    }
}
