package com.astba.backend.dto;

import lombok.Data;
import java.util.ArrayList;
import java.util.List;

@Data
public class LevelDetailResponse {
    private Long id;
    private Integer levelIndex;
    private String title;
    private String description;
    private List<SessionDetailResponse> sessions = new ArrayList<>();
}
