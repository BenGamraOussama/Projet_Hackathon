package com.astba.backend;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import java.util.Map;
import java.util.Objects;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SecurityRbacTest {

    private static final MediaType JSON = MediaType.APPLICATION_JSON;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void missingTokenReturns401() throws Exception {
        mockMvc.perform(get("/api/trainings"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "FORMATEUR")
    void wrongRoleReturns403() throws Exception {
        String payload = Objects.requireNonNull(objectMapper.writeValueAsString(Map.of(
                "title", "Test",
                "description", "Test training",
                "creationMode", "AUTO",
                "levelsCount", 4,
                "sessionsPerLevel", 6
        )), "payload");
        mockMvc.perform(post("/api/trainings")
                        .contentType(JSON)
                        .content(payload))
                .andExpect(status().isForbidden());
    }

    @Test
    void openApiDocsAccessible() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk());
    }
}
