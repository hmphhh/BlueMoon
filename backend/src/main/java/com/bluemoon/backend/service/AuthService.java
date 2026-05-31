package com.bluemoon.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.bluemoon.backend.dtos.response.LoginResponse;
import com.bluemoon.backend.exceptions.DuplicateResourceException;
import com.bluemoon.backend.exceptions.InvalidCredentialsException;
import com.bluemoon.backend.exceptions.InvalidOperationException;
import com.bluemoon.backend.exceptions.ResourceNotFoundException;
import com.bluemoon.backend.repository.ApartmentRepository;
import com.bluemoon.backend.repository.UserRepository;
import com.bluemoon.backend.repository.OtpVerificationTokenRepository;
import com.bluemoon.backend.repository.PasswordResetTokenRepository;
import com.bluemoon.backend.entity.ApartmentEntity;
import com.bluemoon.backend.entity.UserEntity;
import com.bluemoon.backend.enums.OtpTokenType;
import com.bluemoon.backend.entity.OtpVerificationToken;
import com.bluemoon.backend.entity.PasswordResetToken;
import com.bluemoon.backend.security.JwtUtil;

import java.time.LocalDateTime;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private OtpService otpService;

    @Autowired
    private EmailService emailService;

    /**
     * Authenticate user and return login response.
     * Throws InvalidCredentialsException if username or password is incorrect.
     */
    public LoginResponse login(String username, String password) {
        UserEntity user = userRepository.findByUsername(username)
                .orElseThrow(() -> new InvalidCredentialsException("Invalid username or password"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new InvalidCredentialsException("Invalid username or password");
        }

        String token = jwtUtil.generateToken(user.getUsername(), user.getRole().name());
        return new LoginResponse(
                token,
                user.getId(),
                user.getUsername(),
                user.getRole(),
                user.getFullName(),
                user.getApartment() != null ? user.getApartment().getApartmentNumber() : null
        );
    }

    /**
     * Request forgot password: validate email exists and generate OTP.
     * Throws ResourceNotFoundException if email not found.
     */
    public void requestForgotPassword(String email) {
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Email not found in system"));

        // Generate and save OTP
        OtpVerificationToken otpToken = otpService.createAndSaveOtp(user, OtpTokenType.FORGOT_PASSWORD);
        // Send email
        emailService.sendOtpEmail(email, otpToken.getOtp());
    }

    /**
     * Verify OTP for forgot password and generate password reset token.
     * Throws ResourceNotFoundException if email not found.
     * Throws InvalidCredentialsException if OTP is invalid or expired.
     * Returns the UUID reset token.
     */
    @Transactional
    public String verifyForgotPasswordOtp(String email, String otp) {
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Email not found in system"));

        // Verify OTP (deletes if expired/invalid)
        if (!otpService.verifyOtp(user, OtpTokenType.FORGOT_PASSWORD, otp)) {
            throw new InvalidOperationException("Invalid or expired OTP");
        }

        // Delete the OTP after successful verification
        otpService.getAndDeleteOtp(user, OtpTokenType.FORGOT_PASSWORD);

        // Generate password reset token (UUID)
        LocalDateTime expiryDate = LocalDateTime.now().plusHours(1); // Token valid for 1 hour
        PasswordResetToken resetToken = new PasswordResetToken(user, expiryDate);
        passwordResetTokenRepository.save(resetToken);

        return resetToken.getToken();
    }

    /**
     * Reset password using reset token and new password.
     * Throws ResourceNotFoundException if token not found.
     * Throws InvalidCredentialsException if token is expired.
     */
    @Transactional
    public void resetPassword(String resetToken, String newPassword) {
        PasswordResetToken token = passwordResetTokenRepository.findByToken(resetToken)
                .orElseThrow(() -> new ResourceNotFoundException("Invalid or expired reset token"));

        if (token.isExpired()) {
            passwordResetTokenRepository.delete(token);
            throw new InvalidCredentialsException("Reset token has expired");
        }

        UserEntity user = token.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Delete the reset token after use
        passwordResetTokenRepository.delete(token);
    }
}
