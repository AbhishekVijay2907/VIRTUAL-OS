package com.virtualos.repository;

import com.virtualos.model.FileNode;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface FileRepository extends MongoRepository<FileNode, String> {
    List<FileNode> findByUserIdAndParentId(String userId, String parentId);
    List<FileNode> findByUserId(String userId);
}
