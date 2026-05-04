package com.bluemoon.backend.service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.bluemoon.backend.controller.request.UpdateProfileRequest;
import com.bluemoon.backend.repository.UserRepository;
import com.bluemoon.backend.entity.UserEntity;
import com.bluemoon.backend.service.dto.UserDTO;
import com.bluemoon.backend.mapper.UserMapper;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    /**
     * Get all users (admin only).
     */
    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(UserMapper::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get a user by their username.
     */
    public UserDTO getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .map(UserMapper::toDTO)
                .orElse(null);
    }

    /**
     * Update profile — only allows: fullName, email, avatarUrl.
     * Returns the updated user DTO, or null if user not found.
     * Sets isVerified=false if email is changed.
     */
    public UserDTO updateProfile(String username, UpdateProfileRequest request) {
        return userRepository.findByUsername(username)
                .map(user -> {
                    String oldEmail = user.getEmail();

                    // Only allow safe fields to be updated
                    if (request.getFullName() != null) {
                        user.setFullName(request.getFullName());
                    }
                    if (request.getEmail() != null) {
                        user.setEmail(request.getEmail());
                    }
                    if (request.getAvatarUrl() != null) {
                        user.setAvatarUrl(request.getAvatarUrl());
                    }

                    // phoneNumber, identityCardNumber, apartment — IGNORED (read-only)

                    boolean emailChanged = request.getEmail() != null && !request.getEmail().equals(oldEmail);
                    if (emailChanged) {
                        user.setVerified(false);
                        user.setVerificationToken(null);
                    }

                    UserEntity saved = userRepository.save(user);
                    return UserMapper.toDTO(saved);
                })
                .orElse(null);
    }

    /**
     * Send a verification email.
     * Returns a status message, an error message, or null if user not found.
     */
    public String sendVerificationEmail(String username) {
        return userRepository.findByUsername(username)
                .map(user -> {
                    if (user.getEmail() == null || user.getEmail().isBlank()) {
                        throw new IllegalStateException("No email set");
                    }
                    if (user.isVerified()) {
                        return "Email already verified";
                    }
                    String token = UUID.randomUUID().toString();
                    user.setVerificationToken(token);
                    userRepository.save(user);
                    emailService.sendVerificationEmail(user.getEmail(), token);
                    return "Verification email sent";
                })
                .orElse(null);
    }

    /**
     * Verify email with token.
     * Returns a result message, or null if token not found.
     */
    public String verifyEmail(String token) {
        return userRepository.findByVerificationToken(token)
                .map(user -> {
                    user.setVerified(true);
                    user.setVerificationToken(null);
                    userRepository.save(user);
                    return "Email verified successfully! ✅";
                })
                .orElse(null);
    }

    /**
     * Delete a user by ID.
     * Returns true if deleted, false if user not found.
     */
    public boolean deleteUser(Long id) {
        return userRepository.findById(id)
                .map(user -> {
                    userRepository.delete(user);
                    return true;
                })
                .orElse(false);
    }
}
