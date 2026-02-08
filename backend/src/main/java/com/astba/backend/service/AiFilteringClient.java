package com.astba.backend.service;

import com.astba.backend.entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class AiFilteringClient {
    private static final Logger logger = LoggerFactory.getLogger(AiFilteringClient.class);
    private static final Pattern TOKEN_SPLIT = Pattern.compile("[^\\p{IsAlphabetic}0-9]+");

    private final WebClient webClient;

    @Value("${ai.service.url:http://localhost:5005}")
    private String aiServiceUrl;

    private static final Map<String, List<String>> ROLE_KEYWORDS = Map.of(
            "FORMATEUR", List.of("formation", "formateur", "enseignement", "pedagogie", "cours", "atelier", "coach", "education"),
            "RESPONSABLE", List.of("responsable", "coordination", "gestion", "planning", "pilotage", "supervision", "administration", "management")
    );

    public AiFilteringClient(WebClient.Builder builder) {
        this.webClient = builder.build();
    }

    public Map<Long, AiResult> score(String adminChoice, String role, double minScore, List<User> users) {
        if (users == null || users.isEmpty()) {
            return Map.of();
        }
        try {
            AiRequest request = new AiRequest(adminChoice, role, minScore,
                    users.stream()
                            .map(user -> new AiItem(user.getId(), user.getCareerDescription(), user.getRole()))
                            .collect(Collectors.toList()));

            AiResponse response = webClient.post()
                    .uri(aiServiceUrl + "/filter")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(AiResponse.class)
                    .block();

            if (response == null || response.results == null) {
                return fallbackScore(adminChoice, role, minScore, users);
            }
            Map<Long, AiResult> results = new HashMap<>();
            for (AiResult result : response.results) {
                if (result.id != null) {
                    results.put(result.id, result);
                }
            }
            return results;
        } catch (Exception ex) {
            logger.warn("AI filter service unavailable; using fallback scoring", ex);
            return fallbackScore(adminChoice, role, minScore, users);
        }
    }

    private Map<Long, AiResult> fallbackScore(String adminChoice, String role, double minScore, List<User> users) {
        Map<Long, AiResult> results = new HashMap<>();
        Set<String> adminTokens = new HashSet<>(tokenize(adminChoice));
        Set<String> roleTokens = role != null && ROLE_KEYWORDS.containsKey(role)
                ? new HashSet<>(ROLE_KEYWORDS.get(role))
                : new HashSet<>();

        for (User user : users) {
            Set<String> itemRoleTokens = new HashSet<>();
            if (user.getRole() != null && ROLE_KEYWORDS.containsKey(user.getRole().toUpperCase(Locale.ROOT))) {
                itemRoleTokens.addAll(ROLE_KEYWORDS.get(user.getRole().toUpperCase(Locale.ROOT)));
            }
            double score = computeScore(user.getCareerDescription(), adminTokens, union(roleTokens, itemRoleTokens));
            boolean matched = score >= minScore;
            results.put(user.getId(), new AiResult(user.getId(), score, matched));
        }
        return results;
    }

    private Set<String> union(Set<String> a, Set<String> b) {
        Set<String> combined = new HashSet<>(a);
        combined.addAll(b);
        return combined;
    }

    private double computeScore(String description, Set<String> adminTokens, Set<String> roleTokens) {
        Set<String> descTokens = tokenize(description);
        if (descTokens.isEmpty()) {
            return 0.0;
        }
        double scoreAdmin = 0.0;
        double scoreRole = 0.0;
        if (adminTokens != null && !adminTokens.isEmpty()) {
            int overlap = 0;
            for (String token : descTokens) {
                if (adminTokens.contains(token)) {
                    overlap++;
                }
            }
            scoreAdmin = (double) overlap / (double) Math.max(1, adminTokens.size());
        }
        if (roleTokens != null && !roleTokens.isEmpty()) {
            int overlap = 0;
            for (String token : descTokens) {
                if (roleTokens.contains(token)) {
                    overlap++;
                }
            }
            scoreRole = (double) overlap / (double) Math.max(1, roleTokens.size());
        }
        return adminTokens != null && !adminTokens.isEmpty() ? Math.max(scoreAdmin, scoreRole) : scoreRole;
    }

    private Set<String> tokenize(String input) {
        if (input == null || input.isBlank()) {
            return Set.of();
        }
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT);
        String[] parts = TOKEN_SPLIT.split(normalized);
        Set<String> tokens = new HashSet<>();
        for (String part : parts) {
            if (part.length() >= 3) {
                tokens.add(part);
            }
        }
        return tokens;
    }

    public static class AiRequest {
        public String adminChoice;
        public String role;
        public double minScore;
        public List<AiItem> items;

        public AiRequest(String adminChoice, String role, double minScore, List<AiItem> items) {
            this.adminChoice = adminChoice;
            this.role = role;
            this.minScore = minScore;
            this.items = items;
        }
    }

    public static class AiItem {
        public Long id;
        public String careerDescription;
        public String role;

        public AiItem(Long id, String careerDescription, String role) {
            this.id = id;
            this.careerDescription = careerDescription;
            this.role = role;
        }
    }

    public static class AiResponse {
        public List<AiResult> results = new ArrayList<>();
    }

    public static class AiResult {
        public Long id;
        public double score;
        public boolean matched;

        public AiResult() {}

        public AiResult(Long id, double score, boolean matched) {
            this.id = id;
            this.score = score;
            this.matched = matched;
        }
    }
}

