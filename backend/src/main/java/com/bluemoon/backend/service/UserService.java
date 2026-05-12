package com.bluemoon.backend.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.bluemoon.backend.dtos.request.ChangePasswordRequest;
import com.bluemoon.backend.dtos.request.UpdateProfileRequest;
import com.bluemoon.backend.entity.OtpTokenType;
import com.bluemoon.backend.entity.OtpVerificationToken;
import com.bluemoon.backend.entity.UserEntity;
import com.bluemoon.backend.exceptions.InvalidCredentialsException;
import com.bluemoon.backend.exceptions.InvalidOperationException;
import com.bluemoon.backend.exceptions.ResourceNotFoundException;
import com.bluemoon.backend.repository.UserRepository;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private OtpService otpService;

    @Autowired
    private PasswordEncoder passwordEncoder;

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
            otpService.getAndDeleteOtp(user, OtpTokenType.EMAIL_VERIFICATION); // Clear any existing OTP for email verification
        }

        return userRepository.save(user);
    }

    /**
     * Generate a 6-digit OTP and send it to the user's email.
     * Throws ResourceNotFoundException if user not found.
     * Throws InvalidOperationException if email not set or already verified.
     */
    public void sendVerificationOtp(String username) {
        UserEntity user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        if (user.getEmail() == null || user.getEmail().isBlank()) {
            throw new InvalidOperationException("No email set for this user");
        }
        if (user.isVerified()) {
            throw new InvalidOperationException("Email already verified");
        }

        // Create and save OTP token
        OtpVerificationToken otpToken = otpService.createAndSaveOtp(user, OtpTokenType.EMAIL_VERIFICATION);
        
        // Send OTP email for email verification
        emailService.sendOtpEmail(user.getEmail(), otpToken.getOtp());
    }

    /**
     * Verify email with OTP code.
     * Checks that the OTP matches and has not expired.
     * Throws InvalidCredentialsException if OTP is invalid or expired.
     */
    public void verifyOtp(String username, String otp) {
        UserEntity user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        if (user.isVerified()) {
            throw new InvalidOperationException("Email already verified");
        }

        // Verify OTP using OtpService (deletes if invalid/expired)
        if (!otpService.verifyOtp(user, OtpTokenType.EMAIL_VERIFICATION, otp)) {
            throw new InvalidCredentialsException("Invalid or expired OTP");
        }

        // Delete the OTP after successful verification
        otpService.getAndDeleteOtp(user, OtpTokenType.EMAIL_VERIFICATION);

        // Mark user as verified
        user.setVerified(true);
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

    /**
     * Change password for the authenticated user.
     * Verifies the current password before allowing the change.
     * Returns the updated user entity.
     * Throws ResourceNotFoundException if user not found.
     * Throws InvalidCredentialsException if current password is incorrect.
     * Throws InvalidOperationException if new passwords don't match.
     */
    public UserEntity changePassword(String username, ChangePasswordRequest request) {
        UserEntity user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        // Verify current password
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new InvalidCredentialsException("Current password is incorrect");
        }

        // Check if new passwords match
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new InvalidOperationException("New password and confirm password do not match");
        }

        // Check if new password is same as current password
        if (request.getCurrentPassword().equals(request.getNewPassword())) {
            throw new InvalidOperationException("New password must be different from current password");
        }

        // Update password
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        return userRepository.save(user);
    }
}
