package com.bluemoon.backend.controller;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import com.bluemoon.backend.dtos.request.ChangePasswordRequest;
import com.bluemoon.backend.dtos.request.CreateUserRequest;
import com.bluemoon.backend.dtos.request.ResetUserPasswordRequest;
import com.bluemoon.backend.dtos.request.UpdateProfileRequest;
import com.bluemoon.backend.dtos.request.UpdateUserRequest;
import com.bluemoon.backend.dtos.request.VerifyOtpRequest;
import com.bluemoon.backend.dtos.response.ProfileResponse;
import com.bluemoon.backend.dtos.response.UserDetailsResponse;
import com.bluemoon.backend.dtos.response.UserResponse;
import com.bluemoon.backend.entity.UserEntity;
import com.bluemoon.backend.service.UserService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    // ═══════════════════════════════════════════════
    // ADMIN ENDPOINTS
    // ═══════════════════════════════════════════════

    /**
     * GET /api/users — Paginated list with search and filters.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    @SuppressWarnings("unchecked")
    public ResponseEntity<?> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long apartmentId
    ) {
        var result = userService.getAllUsers(page, size, search, role, status, apartmentId);

        // Map content to UserResponse DTOs
        var content = (List<UserEntity>) result.get("content");
        var mappedContent = content.stream()
                .map(this::toUserResponse)
                .collect(Collectors.toList());

        result.put("content", mappedContent);
        return ResponseEntity.ok(result);
    }

    /**
     * GET /api/users/{userId} — User details.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{userId}")
    public ResponseEntity<UserDetailsResponse> getUserDetails(@PathVariable Long userId) {
        UserEntity user = userService.getUserById(userId);
        return ResponseEntity.ok(toUserDetailsResponse(user));
    }

    /**
     * POST /api/users — Create user.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<UserDetailsResponse> createUser(@Valid @RequestBody CreateUserRequest request) {
        UserEntity created = userService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(toUserDetailsResponse(created));
    }

    /**
     * PATCH /api/users/{userId} — Update user.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{userId}")
    public ResponseEntity<?> updateUser(@PathVariable Long userId, @Valid @RequestBody UpdateUserRequest request) {
        userService.updateUser(userId, request);
        return ResponseEntity.ok(Map.of("id", userId, "message", "User updated successfully"));
    }

    /**
     * DELETE /api/users/{userId} — Delete user.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{userId}")
    public ResponseEntity<?> deleteUser(@PathVariable Long userId) {
        userService.deleteUser(userId);
        return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
    }

    /**
     * PATCH /api/users/{userId}/reset-password — Reset user password.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{userId}/reset-password")
    public ResponseEntity<?> resetPassword(@PathVariable Long userId, @Valid @RequestBody ResetUserPasswordRequest request) {
        userService.resetPassword(userId, request);
        return ResponseEntity.ok(Map.of("message", "Password updated successfully"));
    }

    // ═══════════════════════════════════════════════
    // CURRENT USER ENDPOINTS (/api/users/me)
    // ═══════════════════════════════════════════════

    /**
     * GET /api/users/me — Get current user profile.
     */
    @GetMapping("/me")
    public ResponseEntity<ProfileResponse> getMyProfile() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        UserEntity user = userService.getUserByUsername(username);
        return ResponseEntity.ok(toProfileResponse(user));
    }

    /**
     * PATCH /api/users/me — Update current user profile.
     */
    @PatchMapping("/me")
    public ResponseEntity<?> updateMyProfile(@Valid @RequestBody UpdateProfileRequest request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        userService.updateProfile(username, request);
        return ResponseEntity.ok(Map.of("message", "Profile updated successfully"));
    }

    /**
     * PATCH /api/users/me/change-password — Change current user password.
     */
    @PatchMapping("/me/change-password")
    public ResponseEntity<?> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        userService.changePassword(username, request);
        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }

    /**
     * POST /api/users/me/send-verification — Send OTP to email.
     */
    @PostMapping("/me/send-verification")
    public ResponseEntity<?> sendVerification() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        userService.sendVerificationOtp(username);
        return ResponseEntity.ok(Map.of("message", "Verification code sent successfully"));
    }

    /**
     * POST /api/users/me/verify-otp — Verify email with OTP.
     */
    @PostMapping("/me/verify-otp")
    public ResponseEntity<?> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        userService.verifyOtp(username, request.getOtp());
        return ResponseEntity.ok(Map.of("message", "Email verified successfully"));
    }

    /**
     * POST /api/users/me/resend-otp — Resend OTP.
     */
    @PostMapping("/me/resend-otp")
    public ResponseEntity<?> resendOtp() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        userService.sendVerificationOtp(username);
        return ResponseEntity.ok(Map.of("message", "A new verification code has been sent"));
    }

    // ═══════════════════════════════════════════════
    // PRIVATE MAPPING HELPERS
    // ═══════════════════════════════════════════════

    private UserResponse toUserResponse(UserEntity user) {
        UserResponse r = new UserResponse();
        r.setId(user.getId());
        r.setUsername(user.getUsername());
        r.setFullName(user.getFullName());
        r.setIdNumber(user.getIdNumber());
        r.setPhone(user.getPhone());
        r.setRole(user.getRole() != null ? user.getRole().name() : null);
        r.setStatus(user.getStatus() != null ? user.getStatus().name() : null);
        r.setApartmentNumber(user.getApartment() != null ? user.getApartment().getApartmentNumber() : null);
        return r;
    }

    private UserDetailsResponse toUserDetailsResponse(UserEntity user) {
        UserDetailsResponse r = new UserDetailsResponse();
        r.setId(user.getId());
        r.setUsername(user.getUsername());
        r.setEmail(user.getEmail());
        r.setRole(user.getRole() != null ? user.getRole().name() : null);
        r.setVerified(user.getVerified());
        r.setCreatedAt(user.getCreatedAt());
        r.setFullName(user.getFullName());
        r.setPhone(user.getPhone());
        r.setDateOfBirth(user.getDateOfBirth() != null ? user.getDateOfBirth().toString() : null);
        r.setGender(user.getGender() != null ? user.getGender().name() : null);
        r.setIdNumber(user.getIdNumber());
        r.setRelationship(user.getRelationship() != null ? user.getRelationship().name() : null);
        r.setStatus(user.getStatus() != null ? user.getStatus().name() : null);

        if (user.getApartment() != null) {
            r.setApartment(new UserDetailsResponse.ApartmentDto(
                    user.getApartment().getId(),
                    user.getApartment().getApartmentNumber()
            ));
        }
        return r;
    }

    private ProfileResponse toProfileResponse(UserEntity user) {
        ProfileResponse r = new ProfileResponse();
        r.setId(user.getId());
        r.setUsername(user.getUsername());
        r.setEmail(user.getEmail());
        r.setRole(user.getRole() != null ? user.getRole().name() : null);
        r.setVerified(user.getVerified());
        r.setFullName(user.getFullName());
        r.setPhone(user.getPhone());
        r.setDateOfBirth(user.getDateOfBirth() != null ? user.getDateOfBirth().toString() : null);
        r.setGender(user.getGender() != null ? user.getGender().name() : null);
        r.setIdNumber(user.getIdNumber());
        r.setRelationship(user.getRelationship() != null ? user.getRelationship().name() : null);
        r.setStatus(user.getStatus() != null ? user.getStatus().name() : null);

        if (user.getApartment() != null) {
            r.setApartment(new ProfileResponse.ApartmentDto(
                    user.getApartment().getId(),
                    user.getApartment().getApartmentNumber()
            ));
        }
        return r;
    }
}
