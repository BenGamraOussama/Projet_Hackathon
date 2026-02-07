package com.astba.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.networknt.schema.JsonSchema;
import com.networknt.schema.JsonSchemaFactory;
import com.networknt.schema.SpecVersion;
import com.networknt.schema.ValidationMessage;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Component;
import java.io.IOException;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class AiPlanSchemaValidator {
    private final JsonSchema schema;
    private final ObjectMapper objectMapper;
    private final JsonNode schemaNode;

    public AiPlanSchemaValidator(ObjectMapper objectMapper, ResourceLoader resourceLoader) throws IOException {
        this.objectMapper = objectMapper;
        Resource resource = resourceLoader.getResource("classpath:ai/ai-training-plan-v1.json");
        this.schemaNode = objectMapper.readTree(resource.getInputStream());
        JsonSchemaFactory factory = JsonSchemaFactory.getInstance(SpecVersion.VersionFlag.V202012);
        this.schema = factory.getSchema(schemaNode);
    }

    public List<String> validate(JsonNode planNode) {
        Set<ValidationMessage> errors = schema.validate(planNode);
        return errors.stream()
                .map(ValidationMessage::getMessage)
                .sorted()
                .collect(Collectors.toList());
    }

    public JsonNode getSchemaNode() {
        return schemaNode;
    }

    public JsonNode parseJson(String json) throws IOException {
        return objectMapper.readTree(json);
    }
}
