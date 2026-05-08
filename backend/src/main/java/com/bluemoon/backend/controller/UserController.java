package com.bluemoon.backend.controller;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bluemoon.backend.dtos.request.ChangePasswordRequest;
import com.bluemoon.backend.dtos.request.UpdateProfileRequest;
import com.bluemoon.backend.dtos.request.VerifyOtpRequest;
import com.bluemoon.backend.dtos.response.UserResponse;
import com.bluemoon.backend.mapper.UserMapper;
import com.bluemoon.backend.service.UserService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private UserMapper userMapper;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        List<UserResponse> users = userService.getAllUsers().stream()
                .map(userMapper::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    // Get the currently logged-in user's profile
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getMyProfile() {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        var user = userService.getUserByUsername(currentUsername);
        return ResponseEntity.ok(userMapper.toResponse(user));
    }

    /**
     * Update profile — only allows: fullName, email, avatarUrl.
     * phoneNumber, identityCardNumber, and apartment are READ-ONLY (set at registration).
     */
    @PutMapping("/profile")
    public ResponseEntity<UserResponse> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        var updatedUser = userService.updateProfile(currentUsername, request);
        return ResponseEntity.ok(userMapper.toResponse(updatedUser));
    }

    /**
     * Send a 6-digit OTP to the logged-in user's email.
     */
    @PostMapping("/send-verification")
    public ResponseEntity<?> sendVerification() {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        userService.sendVerificationOtp(currentUsername);
        return ResponseEntity.ok(Map.of("message", "Verification code sent successfully"));
    }

    /**
     * Verify email with a 6-digit OTP code.
     */
    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        userService.verifyOtp(currentUsername, request.getOtp());
        return ResponseEntity.ok(Map.of("message", "Email verified successfully"));
    }

    /**
     * Resend a new 6-digit OTP code.
     */
    @PostMapping("/resend-otp")
    public ResponseEntity<?> resendOtp() {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        userService.sendVerificationOtp(currentUsername);
        return ResponseEntity.ok(Map.of("message", "A new verification code has been sent"));
    }

    /**
     * Change password for the currently logged-in user.
     */
    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        var updatedUser = userService.changePassword(currentUsername, request);
        return ResponseEntity.ok(Map.of(
            "message", "Password changed successfully",
            "user", userMapper.toResponse(updatedUser)
        ));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
    }
}
