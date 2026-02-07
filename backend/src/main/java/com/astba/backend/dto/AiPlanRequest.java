package com.astba.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AiPlanRequest {
    @NotBlank
    @Size(max = 2000)
    private String promptText;

    @NotBlank
    private String language;

    private AiPlanConstraints constraints;

    public String getPromptText() {
        return promptText;
    }

    public void setPromptText(String promptText) {
        this.promptText = promptText;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public AiPlanConstraints getConstraints() {
        return constraints;
    }

    public void setConstraints(AiPlanConstraints constraints) {
        this.constraints = constraints;
    }
}
