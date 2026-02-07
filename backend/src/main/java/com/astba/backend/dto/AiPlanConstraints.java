package com.astba.backend.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDate;
import java.util.List;

public class AiPlanConstraints {
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate startDate;
    private List<String> preferredDays;
    private Integer defaultDurationMin;
    private String defaultLocation;

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public List<String> getPreferredDays() {
        return preferredDays;
    }

    public void setPreferredDays(List<String> preferredDays) {
        this.preferredDays = preferredDays;
    }

    public Integer getDefaultDurationMin() {
        return defaultDurationMin;
    }

    public void setDefaultDurationMin(Integer defaultDurationMin) {
        this.defaultDurationMin = defaultDurationMin;
    }

    public String getDefaultLocation() {
        return defaultLocation;
    }

    public void setDefaultLocation(String defaultLocation) {
        this.defaultLocation = defaultLocation;
    }
}
