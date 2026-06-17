package com.bluemoon.backend.service.auth;

import java.time.LocalDateTime;
import java.util.Random;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.bluemoon.backend.enums.auth.OtpTokenType;
import com.bluemoon.backend.entity.auth.OtpVerificationToken;
import com.bluemoon.backend.entity.auth.UserEntity;
import com.bluemoon.backend.repository.auth.OtpVerificationTokenRepository;

@Service
public class OtpService {

    @Autowired
    private OtpVerificationTokenRepository otpVerificationTokenRepository;

    private static final int OTP_LENGTH = 6;
    private static final int OTP_EXPIRY_MINUTES = 5;

    /**
     * Generate a random 6-digit OTP.
     */
    public String generateOtp() {
        Random random = new Random();
        int otp = 100000 + random.nextInt(900000); // Ensures 6 digits
        return String.valueOf(otp);
    }

    /**
     * Create and save OTP verification token for the given user and token type.
     * Replaces any existing OTP for this user and type.
     * Sends OTP email if it's for forgot password.
     */
    @Transactional
    public OtpVerificationToken createAndSaveOtp(UserEntity user, OtpTokenType tokenType) {
        String otp = generateOtp();
        LocalDateTime expiryDate = LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES);

        // Delete any existing OTP for this user and type (lazy delete pattern)
        otpVerificationTokenRepository.deleteByUserAndTokenType(user, tokenType);

        // Create and save new OTP
        OtpVerificationToken otpToken = new OtpVerificationToken(otp, expiryDate, user, tokenType);
        otpToken = otpVerificationTokenRepository.save(otpToken);

        return otpToken;
    }

    /**
     * Verify OTP for the given user and token type.
     * Returns true if OTP is valid and not expired, false otherwise.
     * Deletes expired/invalid OTP immediately (lazy delete).
     */
    @Transactional
    public boolean verifyOtp(UserEntity user, OtpTokenType tokenType, String providedOtp) {
        var optionalOtp = otpVerificationTokenRepository.findByUserAndTokenType(user, tokenType);

        if (optionalOtp.isEmpty()) {
            return false;
        }

        OtpVerificationToken otpToken = optionalOtp.get();

        // Check if OTP is expired
        if (otpToken.isExpired()) {
            otpVerificationTokenRepository.delete(otpToken);
            return false;
        }

        // Check if OTP matches
        if (!otpToken.getOtp().equals(providedOtp)) {
            return false;
        }

        return true;
    }

    /**
     * Retrieve and delete OTP for the given user and token type.
     * Returns the OTP record if it exists, null otherwise.
     */
    @Transactional
    public OtpVerificationToken getAndDeleteOtp(UserEntity user, OtpTokenType tokenType) {
        var optionalOtp = otpVerificationTokenRepository.findByUserAndTokenType(user, tokenType);

        if (optionalOtp.isEmpty()) {
            return null;
        }

        OtpVerificationToken otpToken = optionalOtp.get();
        otpVerificationTokenRepository.delete(otpToken);
        return otpToken;
    }
}
