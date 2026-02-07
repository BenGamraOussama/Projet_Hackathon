package com.astba.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import java.util.Objects;

@Component
@ConfigurationProperties(prefix = "llm.mistral")
public class LlmProperties {
    private String apiKey;
    private @NonNull String baseUrl = "https://api.mistral.ai";
    private @NonNull String model = "mistral-large-latest";
    private boolean stubEnabled = false;
    private int timeoutMs = 20000;
    private int maxTokens = 2500;
    private double temperature = 0.2;

    public String getApiKey() {
        return apiKey;
    }

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }

    public @NonNull String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = Objects.requireNonNull(baseUrl, "baseUrl");
    }

    public @NonNull String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = Objects.requireNonNull(model, "model");
    }

    public boolean isStubEnabled() {
        return stubEnabled;
    }

    public void setStubEnabled(boolean stubEnabled) {
        this.stubEnabled = stubEnabled;
    }

    public int getTimeoutMs() {
        return timeoutMs;
    }

    public void setTimeoutMs(int timeoutMs) {
        this.timeoutMs = timeoutMs;
    }

    public int getMaxTokens() {
        return maxTokens;
    }

    public void setMaxTokens(int maxTokens) {
        this.maxTokens = maxTokens;
    }

    public double getTemperature() {
        return temperature;
    }

    public void setTemperature(double temperature) {
        this.temperature = temperature;
    }
}
