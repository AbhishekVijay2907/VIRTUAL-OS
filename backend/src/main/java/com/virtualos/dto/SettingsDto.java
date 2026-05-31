package com.virtualos.dto;

import jakarta.validation.constraints.NotBlank;

public class SettingsDto {
    @NotBlank(message = "Wallpaper cannot be empty")
    private String wallpaper;

    @NotBlank(message = "Theme cannot be empty")
    private String theme;

    @NotBlank(message = "Accent color cannot be empty")
    private String accentColor;

    @NotBlank(message = "OS Mode cannot be empty")
    private String osMode; // "win11", "macos", "ubuntu"

    private Boolean animationsEnabled;
    private Boolean soundsEnabled;

    public SettingsDto() {}

    public SettingsDto(String wallpaper, String theme, String accentColor, String osMode) {
        this.wallpaper = wallpaper;
        this.theme = theme;
        this.accentColor = accentColor;
        this.osMode = osMode;
        this.animationsEnabled = true;
        this.soundsEnabled = true;
    }

    public SettingsDto(String wallpaper, String theme, String accentColor, String osMode, Boolean animationsEnabled, Boolean soundsEnabled) {
        this.wallpaper = wallpaper;
        this.theme = theme;
        this.accentColor = accentColor;
        this.osMode = osMode;
        this.animationsEnabled = animationsEnabled;
        this.soundsEnabled = soundsEnabled;
    }

    public String getWallpaper() {
        return wallpaper;
    }

    public void setWallpaper(String wallpaper) {
        this.wallpaper = wallpaper;
    }

    public String getTheme() {
        return theme;
    }

    public void setTheme(String theme) {
        this.theme = theme;
    }

    public String getAccentColor() {
        return accentColor;
    }

    public void setAccentColor(String accentColor) {
        this.accentColor = accentColor;
    }

    public String getOsMode() {
        return osMode;
    }

    public void setOsMode(String osMode) {
        this.osMode = osMode;
    }

    public Boolean getAnimationsEnabled() {
        return animationsEnabled;
    }

    public void setAnimationsEnabled(Boolean animationsEnabled) {
        this.animationsEnabled = animationsEnabled;
    }

    public Boolean getSoundsEnabled() {
        return soundsEnabled;
    }

    public void setSoundsEnabled(Boolean soundsEnabled) {
        this.soundsEnabled = soundsEnabled;
    }
}
