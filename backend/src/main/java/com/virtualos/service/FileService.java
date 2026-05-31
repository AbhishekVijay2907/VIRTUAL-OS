package com.virtualos.service;

import com.virtualos.exception.ResourceNotFoundException;
import com.virtualos.model.FileNode;
import com.virtualos.model.Folder;
import com.virtualos.repository.FileRepository;
import com.virtualos.repository.FolderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class FileService {

    @Autowired
    private FolderRepository folderRepository;

    @Autowired
    private FileRepository fileRepository;

    private String normalizeParentId(String parentId) {
        if (parentId == null || parentId.trim().isEmpty() || parentId.equalsIgnoreCase("root") || parentId.equalsIgnoreCase("null")) {
            return null;
        }
        return parentId;
    }

    public Map<String, Object> getContents(String userId, String parentId) {
        String normalizedId = normalizeParentId(parentId);
        List<Folder> folders = folderRepository.findByUserIdAndParentId(userId, normalizedId);
        List<FileNode> files = fileRepository.findByUserIdAndParentId(userId, normalizedId);

        Map<String, Object> contents = new HashMap<>();
        contents.put("folders", folders);
        contents.put("files", files);
        contents.put("parentId", normalizedId);
        return contents;
    }

    public Folder createFolder(String userId, String name, String parentId) {
        String normalizedId = normalizeParentId(parentId);
        Folder folder = new Folder(userId, name, normalizedId);
        return folderRepository.save(folder);
    }

    public FileNode uploadFile(String userId, String name, String parentId, String mimeType, Long size, String content) {
        String normalizedId = normalizeParentId(parentId);
        FileNode file = new FileNode(userId, name, normalizedId, mimeType, size, content, LocalDateTime.now());
        return fileRepository.save(file);
    }

    public Folder renameFolder(String userId, String folderId, String newName) {
        Folder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new ResourceNotFoundException("Folder not found"));

        if (!folder.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Unauthorized modification request");
        }

        folder.setName(newName);
        return folderRepository.save(folder);
    }

    public FileNode renameFile(String userId, String fileId, String newName) {
        FileNode file = fileRepository.findById(fileId)
                .orElseThrow(() -> new ResourceNotFoundException("File not found"));

        if (!file.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Unauthorized modification request");
        }

        file.setName(newName);
        return fileRepository.save(file);
    }

    public void deleteFile(String userId, String fileId) {
        FileNode file = fileRepository.findById(fileId)
                .orElseThrow(() -> new ResourceNotFoundException("File not found"));

        if (!file.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Unauthorized delete request");
        }

        fileRepository.delete(file);
    }

    public void deleteFolder(String userId, String folderId) {
        Folder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new ResourceNotFoundException("Folder not found"));

        if (!folder.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Unauthorized delete request");
        }

        deleteFolderRecursive(userId, folderId);
    }

    private void deleteFolderRecursive(String userId, String folderId) {
        // Find and delete all subfiles
        List<FileNode> files = fileRepository.findByUserIdAndParentId(userId, folderId);
        fileRepository.deleteAll(files);

        // Find and delete all subfolders recursively
        List<Folder> subfolders = folderRepository.findByUserIdAndParentId(userId, folderId);
        for (Folder subfolder : subfolders) {
            deleteFolderRecursive(userId, subfolder.getId());
        }

        // Delete the parent folder
        folderRepository.deleteById(folderId);
    }
}
