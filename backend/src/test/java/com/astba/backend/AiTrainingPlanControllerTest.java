package com.astba.backend;

import com.astba.backend.entity.Training;
import com.astba.backend.entity.TrainingCreationMode;
import com.astba.backend.entity.TrainingStructureStatus;
import com.astba.backend.repository.TrainingRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import java.util.Map;
import java.util.Objects;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "llm.mistral.stub-enabled=true"
})
class AiTrainingPlanControllerTest {

    private static final MediaType JSON = MediaType.APPLICATION_JSON;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private TrainingRepository trainingRepository;

    @Test
    @WithMockUser(roles = "RESPONSABLE")
    void aiPlanRejectsManualTraining() throws Exception {
        Training training = new Training();
        training.setName("Manual Training");
        training.setCreationMode(TrainingCreationMode.MANUAL);
        training.setStructureStatus(TrainingStructureStatus.NOT_GENERATED);
        Training saved = trainingRepository.save(training);
        long trainingId = Objects.requireNonNull(saved.getId(), "trainingId");

        String payload = Objects.requireNonNull(objectMapper.writeValueAsString(Map.of(
                "promptText", "Test prompt",
                "language", "fr"
        )), "payload");

        mockMvc.perform(post("/api/trainings/{id}/ai-plan", trainingId)
                        .contentType(JSON)
                        .content(payload))
                .andExpect(status().isConflict());
    }

    @Test
    @WithMockUser(roles = "RESPONSABLE")
    void applyPlanUpdatesTrainingTitle() throws Exception {
        Training training = new Training();
        training.setName("Auto Training");
        training.setCreationMode(TrainingCreationMode.AUTO);
        training.setStructureStatus(TrainingStructureStatus.NOT_GENERATED);
        Training saved = trainingRepository.save(training);
        long trainingId = Objects.requireNonNull(saved.getId(), "trainingId");

        String planRequest = Objects.requireNonNull(objectMapper.writeValueAsString(Map.of(
                "promptText", "AI stub prompt",
                "language", "en"
        )), "planRequest");

        String planResponse = mockMvc.perform(post("/api/trainings/{id}/ai-plan", trainingId)
                        .contentType(JSON)
                        .content(planRequest))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode draftPlan = objectMapper.readTree(planResponse).path("draftPlan");

        String applyRequest = Objects.requireNonNull(objectMapper.writeValueAsString(Map.of(
                "approvedPlan", draftPlan
        )), "applyRequest");

        mockMvc.perform(post("/api/trainings/{id}/apply-ai-plan", trainingId)
                        .contentType(JSON)
                        .content(applyRequest))
                .andExpect(status().isOk());

        Training updated = trainingRepository.findById(trainingId).orElseThrow();
        assertThat(updated.getName()).isNotEqualTo("Auto Training");
    }
}
