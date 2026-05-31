package com.virtualos.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "folders")
public class Folder {
    @Id
    private String id;
    private String userId;
    private String name;
    private String parentId; // Nullable, points to parent folder ID.

    public Folder() {}

    public Folder(String userId, String name, String parentId) {
        this.userId = userId;
        this.name = name;
        this.parentId = parentId;
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
}
