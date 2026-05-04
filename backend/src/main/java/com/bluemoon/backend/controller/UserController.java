package com.bluemoon.backend.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import com.bluemoon.backend.controller.request.UpdateProfileRequest;
import com.bluemoon.backend.controller.response.ErrorResponse;
import com.bluemoon.backend.controller.response.MessageResponse;
import com.bluemoon.backend.controller.response.ResponseMapper;
import com.bluemoon.backend.controller.response.UserResponse;
import com.bluemoon.backend.service.UserService;
import com.bluemoon.backend.service.dto.UserDTO;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        List<UserResponse> users = userService.getAllUsers().stream()
                .map(ResponseMapper::toUserResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    // Get the currently logged-in user's profile
    @GetMapping("/me")
    public ResponseEntity<?> getMyProfile() {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        UserDTO dto = userService.getUserByUsername(currentUsername);
        if (dto == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(ResponseMapper.toUserResponse(dto));
    }

    /**
     * Update profile — only allows: fullName, email, avatarUrl.
     * phoneNumber, identityCardNumber, and apartment are READ-ONLY (set at registration).
     */
    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        UserDTO updatedUser = userService.updateProfile(currentUsername, request);
        if (updatedUser == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(ResponseMapper.toUserResponse(updatedUser));
    }

    // Send a verification email to the logged-in user
    @PostMapping("/send-verification")
    public ResponseEntity<?> sendVerification() {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        try {
            String result = userService.sendVerificationEmail(currentUsername);
            if (result == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(new MessageResponse(result));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    // Verify email with token
    @GetMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestParam String token) {
        String result = userService.verifyEmail(token);
        if (result == null) {
            return ResponseEntity.badRequest().body(new ErrorResponse("Invalid or expired token"));
        }
        return ResponseEntity.ok(new MessageResponse(result));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        boolean deleted = userService.deleteUser(id);
        if (!deleted) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(new MessageResponse("User deleted successfully"));
    }
}
