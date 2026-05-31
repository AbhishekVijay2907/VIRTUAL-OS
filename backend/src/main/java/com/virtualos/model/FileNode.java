package com.virtualos.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "files")
public class FileNode {
    @Id
    private String id;
    private String userId;
    private String name;
    private String parentId; // ID of the folder containing this file
    private String mimeType;
    private Long size; // Size in bytes
    private String content; // Base64 encoded file contents or text
    private LocalDateTime uploadedAt;

    public FileNode() {}

    public FileNode(String userId, String name, String parentId, String mimeType, Long size, String content, LocalDateTime uploadedAt) {
        this.userId = userId;
        this.name = name;
        this.parentId = parentId;
        this.mimeType = mimeType;
        this.size = size;
        this.content = content;
        this.uploadedAt = uploadedAt;
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

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getParentId() {
        return parentId;
    }

    public void setParentId(String parentId) {
        this.parentId = parentId;
    }

    public String getMimeType() {
        return mimeType;
    }

    public void setMimeType(String mimeType) {
        this.mimeType = mimeType;
    }

    public Long getSize() {
        return size;
    }

    public void setSize(Long size) {
        this.size = size;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public LocalDateTime getUploadedAt() {
        return uploadedAt;
    }

    public void setUploadedAt(LocalDateTime uploadedAt) {
        this.uploadedAt = uploadedAt;
    }
}
