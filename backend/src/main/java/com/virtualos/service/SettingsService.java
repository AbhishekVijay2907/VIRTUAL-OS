package com.virtualos.service;

import com.virtualos.dto.SettingsDto;
import com.virtualos.model.Settings;
import com.virtualos.repository.SettingsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class SettingsService {

    @Autowired
    private SettingsRepository settingsRepository;

    public Settings getSettings(String userId) {
        return settingsRepository.findByUserId(userId)
                .orElseGet(() -> {
                    Settings defaultSettings = new Settings(userId, "wallpaper1", "dark", "#0078d7", "win11");
                    return settingsRepository.save(defaultSettings);
                });
    }

    public Settings updateSettings(String userId, SettingsDto dto) {
        Settings settings = settingsRepository.findByUserId(userId)
                .orElseGet(() -> new Settings(userId, "wallpaper1", "dark", "#0078d7", "win11"));

        settings.setWallpaper(dto.getWallpaper());
        settings.setTheme(dto.getTheme());
        settings.setAccentColor(dto.getAccentColor());
        settings.setOsMode(dto.getOsMode());
        if (dto.getAnimationsEnabled() != null) {
            settings.setAnimationsEnabled(dto.getAnimationsEnabled());
        }
        if (dto.getSoundsEnabled() != null) {
            settings.setSoundsEnabled(dto.getSoundsEnabled());
        }

        return settingsRepository.save(settings);
    }
}
