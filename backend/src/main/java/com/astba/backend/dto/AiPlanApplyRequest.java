package com.astba.backend.dto;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotNull;

public class AiPlanApplyRequest {
    @NotNull
    private JsonNode approvedPlan;

    public JsonNode getApprovedPlan() {
        return approvedPlan;
    }

    public void setApprovedPlan(JsonNode approvedPlan) {
        this.approvedPlan = approvedPlan;
    }
}
