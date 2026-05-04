package com.bluemoon.backend.service;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.bluemoon.backend.entity.User;
import com.bluemoon.backend.repository.UserRepository;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    /**
     * Get all users (admin only).
     */
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    /**
     * Get a user by their username.
     */
    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username).orElse(null);
    }

    /**
     * Update profile — only allows: fullName, email, avatarUrl.
     * Returns the updated user, or null if user not found.
     * Sets isVerified=false if email is changed.
     */
    public User updateProfile(String username, Map<String, String> profileData) {
        return userRepository.findByUsername(username)
                .map(user -> {
                    String oldEmail = user.getEmail();
                    String newEmail = profileData.get("email");

                    // Only allow safe fields to be updated
                    if (profileData.containsKey("fullName")) {
                        user.setFullName(profileData.get("fullName"));
                    }
                    if (profileData.containsKey("email")) {
                        user.setEmail(newEmail);
                    }
                    if (profileData.containsKey("avatarUrl")) {
                        user.setAvatarUrl(profileData.get("avatarUrl"));
                    }

                    // phoneNumber, identityCardNumber, apartment — IGNORED (read-only)

                    boolean emailChanged = newEmail != null && !newEmail.equals(oldEmail);
                    if (emailChanged) {
                        user.setVerified(false);
                        user.setVerificationToken(null);
                    }

                    return userRepository.save(user);
                })
                .orElse(null);
    }

    /**
     * Send a verification email. Returns a status message or error.
     * Possible return keys: "message" (success) or "error" (failure).
     */
    public Map<String, String> sendVerificationEmail(String username) {
        return userRepository.findByUsername(username)
                .map(user -> {
                    if (user.getEmail() == null || user.getEmail().isBlank()) {
                        return Map.of("error", "No email set");
                    }
                    if (user.isVerified()) {
                        return Map.of("message", "Email already verified");
                    }
                    String token = UUID.randomUUID().toString();
                    user.setVerificationToken(token);
                    userRepository.save(user);
                    emailService.sendVerificationEmail(user.getEmail(), token);
                    return Map.of("message", "Verification email sent");
                })
                .orElse(null);
    }

    /**
     * Verify email with token.
     * Returns a result map: "message" on success, "error" on invalid token, or null if not found.
     */
    public Map<String, String> verifyEmail(String token) {
        return userRepository.findByVerificationToken(token)
                .map(user -> {
                    user.setVerified(true);
                    user.setVerificationToken(null);
                    userRepository.save(user);
                    return Map.of("message", "Email verified successfully! ✅");
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
