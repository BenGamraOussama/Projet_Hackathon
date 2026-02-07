package com.astba.backend;

import com.astba.backend.entity.Training;
import com.astba.backend.entity.TrainingCreationMode;
import com.astba.backend.entity.TrainingStructureStatus;
import com.astba.backend.repository.TrainingRepository;
import com.astba.backend.service.MistralLlmClient;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;
import java.util.Objects;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AiTrainingPlanSecurityTest {

    private static final MediaType JSON = MediaType.APPLICATION_JSON;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private TrainingRepository trainingRepository;

    @MockBean
    private MistralLlmClient mistralClient;

    private Training createAutoTraining() {
        Training training = new Training();
        training.setName("Auto Training");
        training.setCreationMode(TrainingCreationMode.AUTO);
        training.setStructureStatus(TrainingStructureStatus.NOT_GENERATED);
        return trainingRepository.save(training);
    }

    @Test
    @WithMockUser(roles = "RESPONSABLE")
    void aiPlanRejectsInvalidJson() throws Exception {
        Training training = createAutoTraining();
        long trainingId = Objects.requireNonNull(training.getId(), "trainingId");
        when(mistralClient.requestPlanJson(anyString(), anyString(), any(JsonNode.class), anyString(), anyString(), any()))
                .thenReturn("not-json");

        String payload = Objects.requireNonNull(objectMapper.writeValueAsString(Map.of(
                "promptText", "Test prompt",
                "language", "fr"
        )), "payload");

        mockMvc.perform(post("/api/trainings/{id}/ai-plan", trainingId)
                        .contentType(JSON)
                        .content(payload))
                .andExpect(status().isBadGateway());
    }

    @Test
    @WithMockUser(roles = "RESPONSABLE")
    void aiPlanRejectsSchemaViolations() throws Exception {
        Training training = createAutoTraining();
        long trainingId = Objects.requireNonNull(training.getId(), "trainingId");
        String invalidPlan = "{\"version\":\"v1\",\"language\":\"en\",\"training\":{\"title\":\"A\",\"description\":\"\"},\"levels\":[]}";
        when(mistralClient.requestPlanJson(anyString(), anyString(), any(JsonNode.class), anyString(), anyString(), any()))
                .thenReturn(invalidPlan, invalidPlan);

        String payload = Objects.requireNonNull(objectMapper.writeValueAsString(Map.of(
                "promptText", "Test prompt",
                "language", "en"
        )), "payload");

        mockMvc.perform(post("/api/trainings/{id}/ai-plan", trainingId)
                        .contentType(JSON)
                        .content(payload))
                .andExpect(status().isBadGateway());
    }

    @Test
    @WithMockUser(roles = "FORMATEUR")
    void aiPlanBlockedForUnauthorizedRole() throws Exception {
        Training training = createAutoTraining();
        long trainingId = Objects.requireNonNull(training.getId(), "trainingId");

        String payload = Objects.requireNonNull(objectMapper.writeValueAsString(Map.of(
                "promptText", "Test prompt",
                "language", "fr"
        )), "payload");

        mockMvc.perform(post("/api/trainings/{id}/ai-plan", trainingId)
                        .contentType(JSON)
                        .content(payload))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "RESPONSABLE")
    void applyPlanRequiresValidApprovedPlan() throws Exception {
        Training training = createAutoTraining();
        long trainingId = Objects.requireNonNull(training.getId(), "trainingId");
        String payload = Objects.requireNonNull(objectMapper.writeValueAsString(Map.of(
                "approvedPlan", Map.of("version", "v1")
        )), "payload");

        mockMvc.perform(post("/api/trainings/{id}/apply-ai-plan", trainingId)
                        .contentType(JSON)
                        .content(payload))
                .andExpect(status().isBadRequest());
    }
}
