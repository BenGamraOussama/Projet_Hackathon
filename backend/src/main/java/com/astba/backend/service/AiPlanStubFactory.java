package com.astba.backend.service;

import com.astba.backend.dto.AiPlanConstraints;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.stereotype.Component;

@Component
public class AiPlanStubFactory {
    private final ObjectMapper objectMapper;

    public AiPlanStubFactory(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public JsonNode buildStub(String language, String promptText, AiPlanConstraints constraints) {
        ObjectNode root = objectMapper.createObjectNode();
        root.put("version", "v1");
        root.put("language", language);

        ObjectNode training = root.putObject("training");
        training.put("title", defaultTitle(language));
        String description = promptText == null ? "" : promptText.trim();
        training.put("description", description.length() > 800 ? description.substring(0, 800) : description);

        ObjectNode global = root.putObject("globalConstraints");
        global.put("levelsCount", 4);
        global.put("sessionsPerLevel", 6);
        if (constraints != null) {
            if (constraints.getDefaultDurationMin() != null) {
                global.put("defaultDurationMin", constraints.getDefaultDurationMin());
            } else {
                global.putNull("defaultDurationMin");
            }
            if (constraints.getDefaultLocation() != null) {
                global.put("defaultLocation", constraints.getDefaultLocation());
            } else {
                global.putNull("defaultLocation");
            }
            if (constraints.getStartDate() != null) {
                global.put("startDate", constraints.getStartDate().toString());
            } else {
                global.putNull("startDate");
            }
            if (constraints.getPreferredDays() != null && !constraints.getPreferredDays().isEmpty()) {
                ArrayNode days = global.putArray("preferredDays");
                constraints.getPreferredDays().forEach(days::add);
            } else {
                global.putNull("preferredDays");
            }
        } else {
            global.putNull("defaultDurationMin");
            global.putNull("defaultLocation");
            global.putNull("startDate");
            global.putNull("preferredDays");
        }

        ArrayNode levels = root.putArray("levels");
        int duration = constraints != null && constraints.getDefaultDurationMin() != null
                ? constraints.getDefaultDurationMin()
                : 120;
        String location = constraints != null ? constraints.getDefaultLocation() : null;

        for (int levelIndex = 1; levelIndex <= 4; levelIndex++) {
            ObjectNode level = levels.addObject();
            level.put("levelIndex", levelIndex);
            level.put("title", label(language, "Level") + " " + levelIndex);
            ArrayNode outcomes = level.putArray("outcomes");
            outcomes.add(label(language, "Outcome") + " 1");
            outcomes.add(label(language, "Outcome") + " 2");

            ArrayNode sessions = level.putArray("sessions");
            for (int sessionIndex = 1; sessionIndex <= 6; sessionIndex++) {
                ObjectNode session = sessions.addObject();
                session.put("sessionIndex", sessionIndex);
                session.put("title", label(language, "Session") + " " + sessionIndex);
                session.put("objective", label(language, "Objective") + " " + sessionIndex);
                session.put("durationMin", duration);
                session.putNull("startAt");
                if (location != null) {
                    session.put("location", location);
                } else {
                    session.putNull("location");
                }
                session.put("modality", "IN_PERSON");
                session.putArray("materials");
                ArrayNode notes = session.putArray("accessibilityNotes");
                notes.add(label(language, "Accessibility note") + " 1");
                notes.add(label(language, "Accessibility note") + " 2");
            }
        }
        return root;
    }

    private String defaultTitle(String language) {
        if ("fr".equalsIgnoreCase(language)) return "Plan de formation (brouillon)";
        if ("ar".equalsIgnoreCase(language)) return "خطة تدريب (مسودة)";
        return "Training plan (draft)";
    }

    private String label(String language, String base) {
        if ("fr".equalsIgnoreCase(language)) {
            switch (base) {
                case "Level":
                    return "Niveau";
                case "Session":
                    return "Session";
                case "Outcome":
                    return "Résultat";
                case "Objective":
                    return "Objectif";
                case "Accessibility note":
                    return "Note accessibilité";
                default:
                    return base;
            }
        }
        if ("ar".equalsIgnoreCase(language)) {
            switch (base) {
                case "Level":
                    return "المستوى";
                case "Session":
                    return "حصة";
                case "Outcome":
                    return "نتيجة";
                case "Objective":
                    return "هدف";
                case "Accessibility note":
                    return "ملاحظة وصول";
                default:
                    return base;
            }
        }
        return base;
    }
}
