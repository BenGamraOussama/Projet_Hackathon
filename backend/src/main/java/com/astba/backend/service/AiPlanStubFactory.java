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
        String theme = extractTheme(promptText);
        training.put("title", defaultTitle(language));
        training.put("description", "Plan de formation structure par niveaux, axe sur " + theme + ".");

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

        String[] levelThemes = {
                "Fondations & outils",
                "Projets guides",
                "Innovation & collaboration",
                "Capstone & certification"
        };

        String[][] sessionTemplates = {
                {"Decouverte & objectifs", "Comprendre les enjeux et definir les objectifs d'apprentissage."},
                {"Prise en main des outils", "Installer/configurer l'environnement et realiser des exercices guides."},
                {"Atelier pratique", "Realiser un mini-projet applique avec livrables simples."},
                {"Prototype technologique", "Ameliorer le projet et integrer des fonctionnalites innovantes."},
                {"Evaluation & feedback", "Auto-evaluation, feedback pair-a-pair, corrections ciblees."},
                {"Synthese & preparation", "Consolider les acquis et preparer le niveau suivant."}
        };

        for (int levelIndex = 1; levelIndex <= 4; levelIndex++) {
            ObjectNode level = levels.addObject();
            level.put("levelIndex", levelIndex);
            level.put("title", label(language, "Level") + " " + levelIndex + " - " + levelThemes[levelIndex - 1]);
            ArrayNode outcomes = level.putArray("outcomes");
            outcomes.add("Maitriser les bases de " + theme);
            outcomes.add("Realiser un livrable pratique lie a " + theme);

            ArrayNode sessions = level.putArray("sessions");
            for (int sessionIndex = 1; sessionIndex <= 6; sessionIndex++) {
                ObjectNode session = sessions.addObject();
                session.put("sessionIndex", sessionIndex);
                session.put("title", label(language, "Session") + " " + sessionIndex + " - " + sessionTemplates[sessionIndex - 1][0]);
                session.put("objective", sessionTemplates[sessionIndex - 1][1]);
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
                notes.add("Supports lisibles, contrastes et accessibles.");
                notes.add("Alternatives visuelles/orales pour chaque activite.");
            }
        }
        return root;
    }

    private String defaultTitle(String language) {
        if ("fr".equalsIgnoreCase(language)) return "Plan de formation (brouillon)";
        if ("ar".equalsIgnoreCase(language)) return "Training plan (draft)";
        return "Training plan (draft)";
    }

    private String extractTheme(String promptText) {
        if (promptText == null || promptText.isBlank()) {
            return "l'apprentissage pratique et les projets technologiques";
        }
        String lower = promptText.toLowerCase();
        if (lower.contains("cyber")) return "la cybersecurite";
        if (lower.contains("data") || lower.contains("donnee")) return "la data et l'analytique";
        if (lower.contains("ia") || lower.contains("intelligence artificielle")) return "l'intelligence artificielle appliquee";
        if (lower.contains("mobile")) return "le developpement mobile";
        if (lower.contains("web")) return "le developpement web";
        if (lower.contains("cloud")) return "le cloud et les services distribues";
        if (lower.contains("innovation")) return "l'innovation educative et les projets technologiques";
        return "l'apprentissage pratique et les projets technologiques";
    }

    private String label(String language, String base) {
        if ("fr".equalsIgnoreCase(language)) {
            switch (base) {
                case "Level":
                    return "Niveau";
                case "Session":
                    return "Session";
                case "Outcome":
                    return "Resultat";
                case "Objective":
                    return "Objectif";
                case "Accessibility note":
                    return "Note accessibilite";
                default:
                    return base;
            }
        }
        if ("ar".equalsIgnoreCase(language)) {
            return base;
        }
        return base;
    }
}
