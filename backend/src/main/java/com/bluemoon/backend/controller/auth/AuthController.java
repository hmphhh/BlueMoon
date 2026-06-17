package com.bluemoon.backend.controller.auth;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bluemoon.backend.dtos.request.auth.ForgotPasswordRequest;
import com.bluemoon.backend.dtos.request.auth.LoginRequest;

import com.bluemoon.backend.dtos.request.auth.ResetPasswordRequest;
import com.bluemoon.backend.dtos.request.auth.VerifyForgotPasswordOtpRequest;
import com.bluemoon.backend.dtos.response.auth.ForgotPasswordResponse;
import com.bluemoon.backend.dtos.response.auth.LoginResponse;
import com.bluemoon.backend.dtos.response.auth.OtpVerificationResponse;
import com.bluemoon.backend.service.auth.AuthService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request.getUsername(), request.getPassword());
        return ResponseEntity.ok(response);
    }

    /**
     * Initiate forgot password flow: validate email and send OTP.
     * Endpoint: POST /api/auth/forgot-password/request
     */
    @PostMapping("/forgot-password/request")
    public ResponseEntity<ForgotPasswordResponse> requestForgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {
        authService.requestForgotPassword(request.getEmail());
        return ResponseEntity.ok(new ForgotPasswordResponse("OTP sent to your email"));
    }

    /**
     * Verify OTP and generate password reset token.
     * Endpoint: POST /api/auth/forgot-password/verify
     */
    @PostMapping("/forgot-password/verify")
    public ResponseEntity<OtpVerificationResponse> verifyForgotPasswordOtp(
            @Valid @RequestBody VerifyForgotPasswordOtpRequest request) {
        String resetToken = authService.verifyForgotPasswordOtp(request.getEmail(), request.getOtp());
        return ResponseEntity.ok(new OtpVerificationResponse(resetToken, "OTP verified successfully"));
    }

    /**
     * Reset password using the reset token.
     * Endpoint: POST /api/auth/forgot-password/reset
     */
    @PostMapping("/forgot-password/reset")
    public ResponseEntity<ForgotPasswordResponse> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request.getResetToken(), request.getNewPassword());
        return ResponseEntity.ok(new ForgotPasswordResponse("Password reset successfully"));
    }
}
