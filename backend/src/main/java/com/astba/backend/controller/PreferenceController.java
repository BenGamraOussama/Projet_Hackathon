package com.astba.backend.controller;

import com.astba.backend.dto.UserPreferenceRequest;
import com.astba.backend.dto.UserPreferenceResponse;
import com.astba.backend.entity.User;
import com.astba.backend.entity.UserPreference;
import com.astba.backend.repository.UserPreferenceRepository;
import com.astba.backend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/preferences")
public class PreferenceController {

    private final UserRepository userRepository;
    private final UserPreferenceRepository preferenceRepository;

    public PreferenceController(UserRepository userRepository, UserPreferenceRepository preferenceRepository) {
        this.userRepository = userRepository;
        this.preferenceRepository = preferenceRepository;
    }

    @GetMapping("/me")
    public ResponseEntity<UserPreferenceResponse> getPreferences() {
        User user = resolveCurrentUser();
        if (user == null) {
            return ResponseEntity.badRequest().build();
        }
        Long userId = user.getId();
        if (userId == null) {
            return ResponseEntity.badRequest().build();
        }
        UserPreference preference = preferenceRepository.findByUserId(userId).orElse(null);
        if (preference == null) {
            preference = defaultPreference(user);
        }
        UserPreferenceResponse response = toResponse(preference);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/me")
    public ResponseEntity<UserPreferenceResponse> updatePreferences(@RequestBody UserPreferenceRequest request) {
        if (request == null) {
            return ResponseEntity.badRequest().build();
        }
        User user = resolveCurrentUser();
        if (user == null) {
            return ResponseEntity.badRequest().build();
        }
        Long userId = user.getId();
        if (userId == null) {
            return ResponseEntity.badRequest().build();
        }
        UserPreference preference = preferenceRepository.findByUserId(userId).orElse(null);
        if (preference == null) {
            preference = defaultPreference(user);
        }

        if (request.getFontSize() != null) {
            preference.setFontSize(request.getFontSize());
        }
        if (request.getContrast() != null) {
            preference.setContrast(request.getContrast());
        }
        if (request.getAnimations() != null) {
            preference.setAnimations(request.getAnimations());
        }
        if (request.getScreenReader() != null) {
            preference.setScreenReader(request.getScreenReader());
        }
        if (request.getFocusHighlight() != null) {
            preference.setFocusHighlight(request.getFocusHighlight());
        }
        if (request.getLineSpacing() != null) {
            preference.setLineSpacing(request.getLineSpacing());
        }
        if (request.getCursorSize() != null) {
            preference.setCursorSize(request.getCursorSize());
        }
        if (request.getColorBlindMode() != null) {
            preference.setColorBlindMode(request.getColorBlindMode());
        }
        if (request.getSimplifyUi() != null) {
            preference.setSimplifyUi(request.getSimplifyUi());
        }

        UserPreference saved = preferenceRepository.save(java.util.Objects.requireNonNull(
                preference, "Preference is required"));
        return ResponseEntity.ok(toResponse(saved));
    }

    private User resolveCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return null;
        }
        return userRepository.findByEmail(authentication.getName()).orElse(null);
    }

    private UserPreference defaultPreference(User user) {
        UserPreference preference = new UserPreference();
        preference.setUser(user);
        preference.setFontSize("medium");
        preference.setContrast("normal");
        preference.setAnimations(true);
        preference.setScreenReader(true);
        preference.setFocusHighlight(true);
        preference.setLineSpacing("normal");
        preference.setCursorSize("normal");
        preference.setColorBlindMode("none");
        preference.setSimplifyUi(false);
        return preference;
    }

    private UserPreferenceResponse toResponse(UserPreference preference) {
        UserPreferenceResponse response = new UserPreferenceResponse();
        response.setFontSize(preference.getFontSize());
        response.setContrast(preference.getContrast());
        response.setAnimations(preference.getAnimations());
        response.setScreenReader(preference.getScreenReader());
        response.setFocusHighlight(preference.getFocusHighlight());
        response.setLineSpacing(preference.getLineSpacing());
        response.setCursorSize(preference.getCursorSize());
        response.setColorBlindMode(preference.getColorBlindMode());
        response.setSimplifyUi(preference.getSimplifyUi());
        return response;
    }
}
