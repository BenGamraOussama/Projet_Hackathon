package com.astba.backend.service;

import com.astba.backend.repository.AppSettingRepository;
import org.springframework.stereotype.Service;

@Service
public class SettingsService {
    private final AppSettingRepository appSettingRepository;

    public SettingsService(AppSettingRepository appSettingRepository) {
        this.appSettingRepository = appSettingRepository;
    }

    public int getMaxStudents() {
        return appSettingRepository.findById("MAX_STUDENTS")
                .map(setting -> {
                    try {
                        return Integer.parseInt(setting.getValue());
                    } catch (Exception ex) {
                        return 25;
                    }
                })
                .orElse(25);
    }
}
