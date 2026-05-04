package com.bluemoon.backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import com.bluemoon.backend.entity.User;
import com.bluemoon.backend.service.UserService;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    // Get the currently logged-in user's profile
    @GetMapping("/me")
    public ResponseEntity<?> getMyProfile() {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userService.getUserByUsername(currentUsername);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(user);
    }

    /**
     * Update profile — only allows: fullName, email, avatarUrl.
     * phoneNumber, identityCardNumber, and apartment are READ-ONLY (set at registration).
     */
    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, String> profileData) {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        User updatedUser = userService.updateProfile(currentUsername, profileData);
        if (updatedUser == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(updatedUser);
    }

    // Send a verification email to the logged-in user
    @PostMapping("/send-verification")
    public ResponseEntity<?> sendVerification() {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        Map<String, String> result = userService.sendVerificationEmail(currentUsername);
        if (result == null) {
            return ResponseEntity.notFound().build();
        }
        if (result.containsKey("error")) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result);
    }

    // Verify email with token
    @GetMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestParam String token) {
        Map<String, String> result = userService.verifyEmail(token);
        if (result == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid or expired token"));
        }
        return ResponseEntity.ok(result);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        boolean deleted = userService.deleteUser(id);
        if (!deleted) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
    }
}
