package com.astba.backend.dto;

import lombok.Data;

@Data
public class UserPreferenceRequest {
    private String fontSize;
    private String contrast;
    private Boolean animations;
    private Boolean screenReader;
    private Boolean focusHighlight;
    private String lineSpacing;
    private String cursorSize;
    private String colorBlindMode;
    private Boolean simplifyUi;
}
