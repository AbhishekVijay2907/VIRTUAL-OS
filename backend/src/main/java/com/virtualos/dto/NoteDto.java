package com.virtualos.dto;

import java.time.LocalDateTime;

public class NoteDto {
    private String id;
    private String title;
    private String content;
    private String category;
    private LocalDateTime updatedAt;

    public NoteDto() {}

    public NoteDto(String id, String title, String content, LocalDateTime updatedAt) {
        this.id = id;
        this.title = title;
        this.content = content;
        this.category = "General";
        this.updatedAt = updatedAt;
    }

    public NoteDto(String id, String title, String content, String category, LocalDateTime updatedAt) {
        this.id = id;
        this.title = title;
        this.content = content;
        this.category = category;
        this.updatedAt = updatedAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }
}
