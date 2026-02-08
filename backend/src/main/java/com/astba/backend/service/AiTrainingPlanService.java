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
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
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
    private final AiPlanStubFactory stubFactory;

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
            ObjectMapper objectMapper,
            AiPlanStubFactory stubFactory) {
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
        this.stubFactory = stubFactory;
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

        JsonNode planNode;
        try {
            planNode = parseStrictJson(raw);
        } catch (ApiException ex) {
            if (Objects.equals(ex.getCode(), "AI_PLAN_INVALID_OUTPUT")) {
                JsonNode stub = stubFactory.buildStub(request.getLanguage(), request.getPromptText(), request.getConstraints());
                auditService.log("AI_PLAN_FALLBACK_STUB", "Training", String.valueOf(training.getId()),
                        "AI plan fallback to stub (invalid JSON)");
                return stub;
            }
            throw ex;
        }
        planNode = normalizePlan(planNode, request);
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
            try {
                planNode = parseStrictJson(repaired);
            } catch (ApiException ex) {
                if (Objects.equals(ex.getCode(), "AI_PLAN_INVALID_OUTPUT")) {
                    JsonNode stub = stubFactory.buildStub(request.getLanguage(), request.getPromptText(), request.getConstraints());
                    auditService.log("AI_PLAN_FALLBACK_STUB", "Training", String.valueOf(training.getId()),
                            "AI plan fallback to stub (repair invalid JSON)");
                    return stub;
                }
                throw ex;
            }
            planNode = normalizePlan(planNode, request);
            errors = schemaValidator.validate(planNode);
            if (!errors.isEmpty()) {
                JsonNode stub = stubFactory.buildStub(request.getLanguage(), request.getPromptText(), request.getConstraints());
                auditService.log("AI_PLAN_FALLBACK_STUB", "Training", String.valueOf(training.getId()),
                        "AI plan fallback to stub (schema mismatch)");
                return stub;
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
            JsonNode recovered = tryRecoverJson(rawJson);
            if (recovered != null) {
                return recovered;
            }
            throw new ApiException(HttpStatus.BAD_GATEWAY, "AI_PLAN_INVALID_OUTPUT",
                    "AI output was not valid JSON");
        }
    }

    private JsonNode normalizePlan(JsonNode planNode, AiPlanRequest request) {
        if (!(planNode instanceof ObjectNode)) {
            return planNode;
        }
        ObjectNode root = (ObjectNode) planNode;
        String language = request.getLanguage() != null ? request.getLanguage() : "fr";
        root.put("version", "v1");
        root.put("language", language);

        ObjectNode trainingNode = getOrCreateObject(root, "training");
        if (isBlank(trainingNode.get("title"))) {
            trainingNode.put("title", defaultTrainingTitle(language));
        }
        if (isBlank(trainingNode.get("description"))) {
            trainingNode.put("description", summarizePrompt(request.getPromptText()));
        }

        ArrayNode levelsNode = getOrCreateArray(root, "levels");
        while (levelsNode.size() < 4) {
            levelsNode.addObject();
        }
        while (levelsNode.size() > 4) {
            levelsNode.remove(levelsNode.size() - 1);
        }

        for (int i = 0; i < 4; i++) {
            JsonNode rawLevel = levelsNode.get(i);
            ObjectNode levelNode = rawLevel instanceof ObjectNode ? (ObjectNode) rawLevel : levelsNode.insertObject(i);
            levelNode.put("levelIndex", i + 1);
            if (isBlank(levelNode.get("title"))) {
                levelNode.put("title", "Niveau " + (i + 1));
            }
            ArrayNode outcomes = getOrCreateArray(levelNode, "outcomes");
            if (outcomes.size() < 2) {
                outcomes.removeAll();
                outcomes.add("Comprendre les objectifs du niveau " + (i + 1));
                outcomes.add("Realiser un livrable pratique pour le niveau " + (i + 1));
            }

            ArrayNode sessionsNode = getOrCreateArray(levelNode, "sessions");
            while (sessionsNode.size() < 6) {
                sessionsNode.addObject();
            }
            while (sessionsNode.size() > 6) {
                sessionsNode.remove(sessionsNode.size() - 1);
            }

            for (int j = 0; j < 6; j++) {
                JsonNode rawSession = sessionsNode.get(j);
                ObjectNode sessionNode = rawSession instanceof ObjectNode ? (ObjectNode) rawSession : sessionsNode.insertObject(j);
                sessionNode.put("sessionIndex", j + 1);
                if (isBlank(sessionNode.get("title"))) {
                    sessionNode.put("title", "Seance " + (j + 1));
                }
                if (isBlank(sessionNode.get("objective"))) {
                    sessionNode.put("objective", "Objectif de la seance " + (j + 1) + " du niveau " + (i + 1));
                }
                if (!sessionNode.has("durationMin")) {
                    sessionNode.put("durationMin", 120);
                }
                if (!sessionNode.has("modality")) {
                    sessionNode.put("modality", "IN_PERSON");
                }
                if (!sessionNode.has("startAt")) {
                    sessionNode.putNull("startAt");
                }
                if (!sessionNode.has("location")) {
                    sessionNode.putNull("location");
                }
                getOrCreateArray(sessionNode, "materials");
                ArrayNode notes = getOrCreateArray(sessionNode, "accessibilityNotes");
                if (notes.size() < 2) {
                    notes.removeAll();
                    notes.add("Supports accessibles et lisibles.");
                    notes.add("Alternatives visuelles et orales disponibles.");
                }
            }
        }
        return root;
    }

    private ObjectNode getOrCreateObject(ObjectNode parent, String field) {
        JsonNode existing = parent.get(field);
        if (existing instanceof ObjectNode) {
            return (ObjectNode) existing;
        }
        return parent.putObject(field);
    }

    private ArrayNode getOrCreateArray(ObjectNode parent, String field) {
        JsonNode existing = parent.get(field);
        if (existing instanceof ArrayNode) {
            return (ArrayNode) existing;
        }
        return parent.putArray(field);
    }

    private boolean isBlank(JsonNode node) {
        return node == null || node.isMissingNode() || node.isNull() || node.asText().isBlank();
    }

    private String defaultTrainingTitle(String language) {
        if ("ar".equalsIgnoreCase(language)) return "? ?? (??)";
        if ("en".equalsIgnoreCase(language)) return "Training plan (draft)";
        return "Plan de formation (brouillon)";
    }

    private String summarizePrompt(String promptText) {
        if (promptText == null || promptText.isBlank()) {
            return "Plan de formation structure par niveaux.";
        }
        String cleaned = promptText.replaceAll("\\s+", " ").trim();
        return cleaned.length() > 180 ? cleaned.substring(0, 180) : cleaned;
    }

    private JsonNode tryRecoverJson(String rawJson) {
        if (rawJson == null || rawJson.isBlank()) return null;
        int start = rawJson.indexOf('{');
        int end = rawJson.lastIndexOf('}');
        if (start < 0 || end <= start) return null;
        String slice = rawJson.substring(start, end + 1);
        try {
            return schemaValidator.parseJson(slice);
        } catch (IOException ex) {
            return null;
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

