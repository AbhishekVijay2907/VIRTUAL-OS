package com.virtualos.repository;

import com.virtualos.model.Settings;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface SettingsRepository extends MongoRepository<Settings, String> {
    Optional<Settings> findByUserId(String userId);
}
