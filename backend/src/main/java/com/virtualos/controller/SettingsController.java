package com.virtualos.controller;

import com.virtualos.dto.SettingsDto;
import com.virtualos.model.Settings;
import com.virtualos.service.SettingsService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settings")
public class SettingsController {

    @Autowired
    private SettingsService settingsService;

    private String getAuthenticatedUserId() {
        return (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    @GetMapping
    public ResponseEntity<Settings> getSettings() {
        String userId = getAuthenticatedUserId();
        Settings settings = settingsService.getSettings(userId);
        return ResponseEntity.ok(settings);
    }

    @PutMapping
    public ResponseEntity<Settings> updateSettings(@Valid @RequestBody SettingsDto dto) {
        String userId = getAuthenticatedUserId();
        Settings settings = settingsService.updateSettings(userId, dto);
        return ResponseEntity.ok(settings);
    }
}
