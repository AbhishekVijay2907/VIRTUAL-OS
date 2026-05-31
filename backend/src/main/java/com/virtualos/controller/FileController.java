package com.virtualos.controller;

import com.virtualos.dto.FileUploadRequest;
import com.virtualos.dto.FolderRequest;
import com.virtualos.dto.RenameRequest;
import com.virtualos.model.FileNode;
import com.virtualos.model.Folder;
import com.virtualos.service.FileService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/files")
public class FileController {

    @Autowired
    private FileService fileService;

    private String getAuthenticatedUserId() {
        return (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getFiles(@RequestParam(required = false) String parentId) {
        String userId = getAuthenticatedUserId();
        Map<String, Object> contents = fileService.getContents(userId, parentId);
        return ResponseEntity.ok(contents);
    }

    @PostMapping("/folder")
    public ResponseEntity<Folder> createFolder(@Valid @RequestBody FolderRequest request) {
        String userId = getAuthenticatedUserId();
        Folder folder = fileService.createFolder(userId, request.getName(), request.getParentId());
        return ResponseEntity.ok(folder);
    }

    @PostMapping("/upload")
    public ResponseEntity<FileNode> uploadFile(@Valid @RequestBody FileUploadRequest request) {
        String userId = getAuthenticatedUserId();
        // Check size limit: 5MB (5 * 1024 * 1024 bytes)
        if (request.getSize() > 5 * 1024 * 1024) {
            throw new IllegalArgumentException("File size exceeds maximum limit of 5MB");
        }
        FileNode file = fileService.uploadFile(
                userId,
                request.getName(),
                request.getParentId(),
                request.getMimeType(),
                request.getSize(),
                request.getContent()
        );
        return ResponseEntity.ok(file);
    }

    @PutMapping("/folder/{id}/rename")
    public ResponseEntity<Folder> renameFolder(@PathVariable String id, @Valid @RequestBody RenameRequest request) {
        String userId = getAuthenticatedUserId();
        Folder folder = fileService.renameFolder(userId, id, request.getName());
        return ResponseEntity.ok(folder);
    }

    @PutMapping("/file/{id}/rename")
    public ResponseEntity<FileNode> renameFile(@PathVariable String id, @Valid @RequestBody RenameRequest request) {
        String userId = getAuthenticatedUserId();
        FileNode file = fileService.renameFile(userId, id, request.getName());
        return ResponseEntity.ok(file);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFile(@PathVariable String id) {
        String userId = getAuthenticatedUserId();
        fileService.deleteFile(userId, id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/folder/{id}")
    public ResponseEntity<Void> deleteFolder(@PathVariable String id) {
        String userId = getAuthenticatedUserId();
        fileService.deleteFolder(userId, id);
        return ResponseEntity.noContent().build();
    }
}
