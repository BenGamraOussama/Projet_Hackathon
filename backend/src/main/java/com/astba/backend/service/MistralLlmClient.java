package com.astba.backend.service;

import com.astba.backend.config.LlmProperties;
import com.astba.backend.dto.AiPlanConstraints;
import com.astba.backend.exception.ApiException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.netty.channel.ChannelOption;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.netty.http.client.HttpClient;

import java.io.IOException;
import java.time.Duration;

@Component
public class MistralLlmClient {
    private static final Logger log = LoggerFactory.getLogger(MistralLlmClient.class);
    private static final String CHAT_PATH = "/v1/chat/completions";

    private final LlmProperties properties;
    private final ObjectMapper objectMapper;
    private final AiPlanStubFactory stubFactory;
    private final WebClient webClient;

    public MistralLlmClient(@NonNull LlmProperties properties,
                            @NonNull ObjectMapper objectMapper,
                            @NonNull AiPlanStubFactory stubFactory) {
        this.properties = properties;
        this.objectMapper = objectMapper;
        this.stubFactory = stubFactory;

        HttpClient httpClient = buildHttpClient();

        this.webClient = WebClient.builder()
                .baseUrl(properties.getBaseUrl())
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    public String requestPlanJson(String systemPrompt,
                                  String userPrompt,
                                  JsonNode schemaNode,
                                  String language,
                                  String promptText,
                                  AiPlanConstraints constraints) {
        if (properties.isStubEnabled()) {
            try {
                JsonNode stub = stubFactory.buildStub(language, promptText, constraints);
                return objectMapper.writeValueAsString(stub);
            } catch (IOException ex) {
                throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "AI_STUB_FAILED",
                        "Unable to generate stub plan");
            }
        }
        if (properties.getApiKey() == null || properties.getApiKey().isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "AI_PROVIDER_NOT_CONFIGURED",
                    "Mistral API key is missing. Set MISTRAL_API_KEY.");
        }

        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("model", properties.getModel());
        payload.put("temperature", properties.getTemperature());
        payload.put("max_tokens", properties.getMaxTokens());
        ArrayNode messages = payload.putArray("messages");
        ObjectNode systemMessage = messages.addObject();
        systemMessage.put("role", "system");
        systemMessage.put("content", systemPrompt);
        ObjectNode userMessage = messages.addObject();
        userMessage.put("role", "user");
        userMessage.put("content", userPrompt);

        ObjectNode responseFormat = payload.putObject("response_format");
        responseFormat.put("type", "json_schema");
        ObjectNode jsonSchema = responseFormat.putObject("json_schema");
        jsonSchema.put("name", "astba_ai_training_plan_v1");
        jsonSchema.set("schema", schemaNode);

        String responseBody;
        try {
            responseBody = webClient.post()
                    .uri(CHAT_PATH)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + properties.getApiKey())
                    .bodyValue(payload)
                    .exchangeToMono(this::handleResponse)
                    .block(Duration.ofMillis(properties.getTimeoutMs()));
        } catch (IllegalStateException ex) {
            String message = ex.getMessage() != null ? ex.getMessage() : "";
            if (message.contains("Timeout on blocking read")) {
                throw new ApiException(HttpStatus.GATEWAY_TIMEOUT, "AI_TIMEOUT",
                        "LLM request timed out. Try again or reduce prompt size.");
            }
            throw ex;
        }

        if (responseBody == null || responseBody.isBlank()) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "AI_EMPTY_RESPONSE",
                    "LLM response missing content");
        }

        return extractContent(responseBody);
    }

    private Mono<String> handleResponse(ClientResponse response) {
        String requestId = response.headers().header("x-request-id").stream().findFirst().orElse(null);
        if (requestId != null && !requestId.isBlank()) {
            log.info("Mistral request-id={}", requestId);
        }
        if (response.statusCode().isError()) {
            return response.bodyToMono(String.class)
                    .defaultIfEmpty("")
                    .flatMap(body -> Mono.error(new ApiException(HttpStatus.BAD_GATEWAY, "AI_PROVIDER_ERROR",
                            "LLM provider error")));
        }
        return response.bodyToMono(String.class);
    }

    private String extractContent(String responseBody) {
        try {
            JsonNode responseJson = objectMapper.readTree(responseBody);
            JsonNode contentNode = responseJson.at("/choices/0/message/content");
            if (contentNode.isMissingNode() || contentNode.isNull()) {
                throw new ApiException(HttpStatus.BAD_GATEWAY, "AI_EMPTY_RESPONSE",
                        "LLM response missing content");
            }
            if (contentNode.isObject() || contentNode.isArray()) {
                return objectMapper.writeValueAsString(contentNode);
            }
            return contentNode.asText();
        } catch (IOException ex) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "AI_PROVIDER_ERROR",
                    "Failed to parse LLM response");
        }
    }

    private HttpClient buildHttpClient() {
        return HttpClient.create()
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, properties.getTimeoutMs())
                .responseTimeout(Duration.ofMillis(properties.getTimeoutMs()));
    }
}
