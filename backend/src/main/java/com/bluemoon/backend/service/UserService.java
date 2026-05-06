package com.bluemoon.backend.service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.bluemoon.backend.dtos.request.UpdateProfileRequest;
import com.bluemoon.backend.exceptions.InvalidOperationException;
import com.bluemoon.backend.exceptions.ResourceNotFoundException;
import com.bluemoon.backend.repository.UserRepository;
import com.bluemoon.backend.entity.UserEntity;

@Service
public class UserService {

    private static final int OTP_LENGTH = 6;
    private static final int OTP_EXPIRY_MINUTES = 5;
    private static final SecureRandom RANDOM = new SecureRandom();

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
            user.setVerificationOtp(null);
            user.setOtpExpiryTime(null);
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

        String otp = generateOtp();
        user.setVerificationOtp(otp);
        user.setOtpExpiryTime(LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES));
        userRepository.save(user);

        emailService.sendOtpEmail(user.getEmail(), otp);
    }

    /**
     * Verify email with OTP code.
     * Checks that the OTP matches and has not expired.
     * Throws InvalidOperationException if OTP is invalid or expired.
     */
    public void verifyOtp(String username, String otp) {
        UserEntity user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        if (user.isVerified()) {
            throw new InvalidOperationException("Email already verified");
        }

        if (user.getVerificationOtp() == null) {
            throw new InvalidOperationException("No OTP has been requested. Please request a new code.");
        }

        if (user.getOtpExpiryTime() != null && LocalDateTime.now().isAfter(user.getOtpExpiryTime())) {
            // Clear expired OTP
            user.setVerificationOtp(null);
            user.setOtpExpiryTime(null);
            userRepository.save(user);
            throw new InvalidOperationException("OTP has expired. Please request a new code.");
        }

        if (!otp.equals(user.getVerificationOtp())) {
            throw new InvalidOperationException("Invalid OTP. Please check your code and try again.");
        }

        // OTP is valid — mark as verified
        user.setVerified(true);
        user.setVerificationOtp(null);
        user.setOtpExpiryTime(null);
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
     * Generate a secure random 6-digit OTP code.
     */
    private String generateOtp() {
        int bound = (int) Math.pow(10, OTP_LENGTH);
        int number = RANDOM.nextInt(bound);
        return String.format("%0" + OTP_LENGTH + "d", number);
    }
}
