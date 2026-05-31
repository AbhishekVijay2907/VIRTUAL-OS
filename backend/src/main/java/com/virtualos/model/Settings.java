package com.virtualos.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "settings")
public class Settings {
    @Id
    private String id;
    private String userId;
    private String wallpaper;
    private String theme; // "dark" or "light"
    private String accentColor; // Accent color hex or CSS theme value
    private String osMode; // "win11", "macos", "ubuntu"
    private Boolean animationsEnabled = true;
    private Boolean soundsEnabled = true;

    public Settings() {}

    public Settings(String userId, String wallpaper, String theme, String accentColor, String osMode) {
        this.userId = userId;
        this.wallpaper = wallpaper;
        this.theme = theme;
        this.accentColor = accentColor;
        this.osMode = osMode;
        this.animationsEnabled = true;
        this.soundsEnabled = true;
    }

    public Settings(String userId, String wallpaper, String theme, String accentColor, String osMode, Boolean animationsEnabled, Boolean soundsEnabled) {
        this.userId = userId;
        this.wallpaper = wallpaper;
        this.theme = theme;
        this.accentColor = accentColor;
        this.osMode = osMode;
        this.animationsEnabled = animationsEnabled != null ? animationsEnabled : true;
        this.soundsEnabled = soundsEnabled != null ? soundsEnabled : true;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
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
        return animationsEnabled != null ? animationsEnabled : true;
    }

    public void setAnimationsEnabled(Boolean animationsEnabled) {
        this.animationsEnabled = animationsEnabled;
    }

    public Boolean getSoundsEnabled() {
        return soundsEnabled != null ? soundsEnabled : true;
    }

    public void setSoundsEnabled(Boolean soundsEnabled) {
        this.soundsEnabled = soundsEnabled;
    }
}
