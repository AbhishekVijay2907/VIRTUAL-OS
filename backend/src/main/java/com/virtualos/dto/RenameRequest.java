package com.virtualos.dto;

import jakarta.validation.constraints.NotBlank;

public class RenameRequest {
    @NotBlank(message = "New name cannot be empty")
    private String name;

    public RenameRequest() {}

    public RenameRequest(String name) {
        this.name = name;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
