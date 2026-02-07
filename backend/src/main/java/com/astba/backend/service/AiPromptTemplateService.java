package com.astba.backend.service;

import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Component
public class AiPromptTemplateService {
    private final String systemTemplate;
    private final String repairTemplate;

    public AiPromptTemplateService(@NonNull ResourceLoader resourceLoader) throws IOException {
        this.systemTemplate = readResource(resourceLoader, "classpath:ai/llm_system_prompt.txt");
        this.repairTemplate = readResource(resourceLoader, "classpath:ai/llm_repair_prompt.txt");
    }

    public String getSystemPrompt() {
        return systemTemplate;
    }

    public String getRepairPrompt() {
        return repairTemplate;
    }

    public String buildUserPrompt(String promptText, String constraintsJson, String language) {
        return String.join("\n",
                "USER_DESCRIPTION:",
                promptText == null ? "" : promptText,
                "",
                "CONSTRAINTS_JSON:",
                constraintsJson == null ? "{}" : constraintsJson,
                "",
                "LANGUAGE:",
                language == null ? "" : language);
    }

    public String buildRepairUserPrompt(String errors, String previousJson) {
        return String.join("\n",
                "Validation errors:",
                errors == null ? "" : errors,
                "",
                "Previous JSON:",
                previousJson == null ? "" : previousJson);
    }

    private String readResource(@NonNull ResourceLoader resourceLoader, @NonNull String location) throws IOException {
        Resource resource = resourceLoader.getResource(location);
        return new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
    }
}
