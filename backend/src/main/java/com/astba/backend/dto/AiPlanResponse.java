package com.astba.backend.dto;

import com.fasterxml.jackson.databind.JsonNode;

public class AiPlanResponse {
    private JsonNode draftPlan;

    public AiPlanResponse(JsonNode draftPlan) {
        this.draftPlan = draftPlan;
    }

    public JsonNode getDraftPlan() {
        return draftPlan;
    }

    public void setDraftPlan(JsonNode draftPlan) {
        this.draftPlan = draftPlan;
    }
}
