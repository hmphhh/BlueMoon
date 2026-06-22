package com.bluemoon.backend.service.auth;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.bluemoon.backend.dtos.response.auth.LoginResponse;
import com.bluemoon.backend.exceptions.InvalidCredentialsException;
import com.bluemoon.backend.exceptions.InvalidOperationException;
import com.bluemoon.backend.exceptions.ResourceNotFoundException;
import com.bluemoon.backend.repository.auth.UserRepository;
import com.bluemoon.backend.repository.auth.OtpVerificationTokenRepository;
import com.bluemoon.backend.repository.auth.PasswordResetTokenRepository;
import com.bluemoon.backend.entity.auth.UserEntity;
import com.bluemoon.backend.enums.auth.OtpTokenType;
import com.bluemoon.backend.entity.auth.OtpVerificationToken;
import com.bluemoon.backend.entity.auth.PasswordResetToken;
import com.bluemoon.backend.security.JwtUtil;

import java.io.IOException;
import java.security.GeneralSecurityException;
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
    private GoogleIdTokenVerifier googleIdTokenVerifier;

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
     * Authenticate a user via Google ID token.
     * The token is verified against Google's public keys. The email extracted
     * from the token is matched case-insensitively to a local account.
     *
     * To prevent user enumeration, "account not found" and "account not
     * locally verified" both produce the same generic error response.
     *
     * Throws InvalidCredentialsException if the token is invalid/expired,
     * if email_verified is false on the Google account, if no local account
     * matches the email, or if the local account's verified flag is not true.
     */
    public LoginResponse loginWithGoogle(String idToken) {
        GoogleIdToken.Payload payload;
        try {
            GoogleIdToken googleIdToken = googleIdTokenVerifier.verify(idToken);
            if (googleIdToken == null) {
                throw new InvalidCredentialsException("Invalid or expired Google token");
            }
            payload = googleIdToken.getPayload();
        } catch (GeneralSecurityException | IOException e) {
            throw new InvalidCredentialsException("Google token verification failed");
        }

        // Reject tokens where Google itself has not verified the email address
        if (!Boolean.TRUE.equals(payload.getEmailVerified())) {
            throw new InvalidCredentialsException("Google Sign-In failed: Account not found or email not verified.");
        }

        // Normalize to lowercase to avoid case-mismatch with stored emails
        String email = payload.getEmail().toLowerCase();

        // Look up local account; intentionally return the same generic error
        // whether the account doesn't exist or exists but is unverified,
        // to prevent user enumeration.
        UserEntity user = userRepository.findByEmailIgnoreCase(email)
                .filter(u -> Boolean.TRUE.equals(u.getVerified()))
                .orElseThrow(() -> new InvalidCredentialsException(
                        "Google Sign-In failed: Account not found or email not verified."));

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
