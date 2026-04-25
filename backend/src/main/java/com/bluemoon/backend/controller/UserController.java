package com.bluemoon.backend.controller;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import com.bluemoon.backend.repository.UserRepository;
import com.bluemoon.backend.entity.User;
import com.bluemoon.backend.service.EmailService;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    // Get the currently logged-in user's profile
    @GetMapping("/me")
    public ResponseEntity<?> getMyProfile() {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(currentUsername)
                .map(user -> ResponseEntity.ok(user))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Update profile — only allows: fullName, email, avatarUrl.
     * phoneNumber, identityCardNumber, and apartment are READ-ONLY (set at registration).
     */
    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, String> profileData) {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();

        return userRepository.findByUsername(currentUsername)
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

                    User savedUser = userRepository.save(user);
                    return ResponseEntity.ok(savedUser);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // Send a verification email to the logged-in user
    @PostMapping("/send-verification")
    public ResponseEntity<?> sendVerification() {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(currentUsername)
                .map(user -> {
                    if (user.getEmail() == null || user.getEmail().isBlank()) {
                        return ResponseEntity.badRequest().body(Map.of("error", "No email set"));
                    }
                    if (user.isVerified()) {
                        return ResponseEntity.ok(Map.of("message", "Email already verified"));
                    }
                    String token = UUID.randomUUID().toString();
                    user.setVerificationToken(token);
                    userRepository.save(user);
                    emailService.sendVerificationEmail(user.getEmail(), token);
                    return ResponseEntity.ok(Map.of("message", "Verification email sent"));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // Verify email with token
    @GetMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestParam String token) {
        return userRepository.findByVerificationToken(token)
                .map(user -> {
                    user.setVerified(true);
                    user.setVerificationToken(null);
                    userRepository.save(user);
                    return ResponseEntity.ok(Map.of("message", "Email verified successfully! ✅"));
                })
                .orElse(ResponseEntity.badRequest().body(Map.of("error", "Invalid or expired token")));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(user -> {
                    userRepository.delete(user);
                    return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
