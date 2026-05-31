package com.virtualos.dto;

import jakarta.validation.constraints.NotBlank;

public class FolderRequest {
    @NotBlank(message = "Folder name cannot be empty")
    private String name;
    private String parentId;

    public FolderRequest() {}

    public FolderRequest(String name, String parentId) {
        this.name = name;
        this.parentId = parentId;
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
}
