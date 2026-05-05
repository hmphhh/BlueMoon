package com.bluemoon.backend.service;

import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.bluemoon.backend.dtos.request.UpdateProfileRequest;
import com.bluemoon.backend.exceptions.InvalidOperationException;
import com.bluemoon.backend.exceptions.ResourceNotFoundException;
import com.bluemoon.backend.repository.UserRepository;
import com.bluemoon.backend.entity.UserEntity;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    /**
     * Get all users (admin only).
     */
    public List<UserEntity> getAllUsers() {
        return userRepository.findAll();
    }

    /**
     * Get a user by their username.
     * Throws ResourceNotFoundException if user not found.
     */
    public UserEntity getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
    }

    /**
     * Update profile — only allows: fullName, email, avatarUrl.
     * Returns the updated user entity.
     * Throws ResourceNotFoundException if user not found.
     * Sets isVerified=false if email is changed.
     */
    public UserEntity updateProfile(String username, UpdateProfileRequest request) {
        UserEntity user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

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

        return userRepository.save(user);
    }

    /**
     * Send a verification email.
     * Throws ResourceNotFoundException if user not found.
     * Throws InvalidOperationException if email not set or already verified.
     */
    public void sendVerificationEmail(String username) {
        UserEntity user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        if (user.getEmail() == null || user.getEmail().isBlank()) {
            throw new InvalidOperationException("No email set for this user");
        }
        if (user.isVerified()) {
            throw new InvalidOperationException("Email already verified");
        }

        String token = UUID.randomUUID().toString();
        user.setVerificationToken(token);
        userRepository.save(user);
        emailService.sendVerificationEmail(user.getEmail(), token);
    }

    /**
     * Verify email with token.
     * Throws ResourceNotFoundException if token is invalid or expired.
     */
    public void verifyEmail(String token) {
        UserEntity user = userRepository.findByVerificationToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Invalid or expired verification token"));

        user.setVerified(true);
        user.setVerificationToken(null);
        userRepository.save(user);
    }

    /**
     * Delete a user by ID.
     * Throws ResourceNotFoundException if user not found.
     */
    public void deleteUser(Long id) {
        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        userRepository.delete(user);
    }
}
