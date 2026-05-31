package com.virtualos.repository;

import com.virtualos.model.Folder;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface FolderRepository extends MongoRepository<Folder, String> {
    List<Folder> findByUserIdAndParentId(String userId, String parentId);
    List<Folder> findByUserId(String userId);
}
