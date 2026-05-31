package com.virtualos.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class FileUploadRequest {
    @NotBlank(message = "File name cannot be empty")
    private String name;
    private String parentId;

    @NotBlank(message = "MIME type cannot be empty")
    private String mimeType;

    @NotNull(message = "File size cannot be null")
    private Long size;

    @NotBlank(message = "File content cannot be empty")
    private String content; // Base64 content

    public FileUploadRequest() {}

    public FileUploadRequest(String name, String parentId, String mimeType, Long size, String content) {
        this.name = name;
        this.parentId = parentId;
        this.mimeType = mimeType;
        this.size = size;
        this.content = content;
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
}
