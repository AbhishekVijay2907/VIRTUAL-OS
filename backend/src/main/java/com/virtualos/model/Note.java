package com.virtualos.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "notes")
public class Note {
    @Id
    private String id;
    private String userId;
    private String title;
    private String content;
    private String category = "General";
    private LocalDateTime updatedAt;

    public Note() {}

    public Note(String userId, String title, String content, LocalDateTime updatedAt) {
        this.userId = userId;
        this.title = title;
        this.content = content;
        this.category = "General";
        this.updatedAt = updatedAt;
    }

    public Note(String userId, String title, String content, String category, LocalDateTime updatedAt) {
        this.userId = userId;
        this.title = title;
        this.content = content;
        this.category = category != null ? category : "General";
        this.updatedAt = updatedAt;
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
        return category != null ? category : "General";
    }

    public void setCategory(String category) {
        this.category = category;
    }
}
