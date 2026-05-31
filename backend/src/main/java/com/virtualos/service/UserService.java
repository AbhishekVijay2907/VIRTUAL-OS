package com.virtualos.service;

import com.virtualos.dto.AuthRequest;
import com.virtualos.dto.AuthResponse;
import com.virtualos.model.Settings;
import com.virtualos.model.User;
import com.virtualos.repository.SettingsRepository;
import com.virtualos.repository.UserRepository;
import com.virtualos.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SettingsRepository settingsRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    public AuthResponse signup(AuthRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username is already taken");
        }

        // Create and save User
        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        User savedUser = userRepository.save(user);

        // Create default desktop settings for the new user
        Settings defaultSettings = new Settings(savedUser.getId(), "wallpaper1", "dark", "#0078d7", "win11");
        settingsRepository.save(defaultSettings);

        // Generate JWT Token
        String token = jwtTokenProvider.generateToken(savedUser.getId(), savedUser.getUsername());

        return new AuthResponse(token, savedUser.getUsername(), savedUser.getId());
    }

    public AuthResponse login(AuthRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("Invalid username or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid username or password");
        }

        // Generate JWT Token
        String token = jwtTokenProvider.generateToken(user.getId(), user.getUsername());

        return new AuthResponse(token, user.getUsername(), user.getId());
    }
}
