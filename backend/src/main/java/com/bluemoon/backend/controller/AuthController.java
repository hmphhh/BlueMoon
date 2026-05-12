package com.bluemoon.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bluemoon.backend.dtos.request.ForgotPasswordRequest;
import com.bluemoon.backend.dtos.request.LoginRequest;
import com.bluemoon.backend.dtos.request.RegisterRequest;
import com.bluemoon.backend.dtos.request.ResetPasswordRequest;
import com.bluemoon.backend.dtos.request.VerifyForgotPasswordOtpRequest;
import com.bluemoon.backend.dtos.response.ForgotPasswordResponse;
import com.bluemoon.backend.dtos.response.LoginResponse;
import com.bluemoon.backend.dtos.response.OtpVerificationResponse;
import com.bluemoon.backend.dtos.response.UserResponse;
import com.bluemoon.backend.mapper.UserMapper;
import com.bluemoon.backend.service.AuthService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserMapper userMapper;

    /**
     * Admin registers a new account.
     * Body: { phoneNumber, identityCardNumber, apartmentNumber (optional for ADMIN), role (optional, default USER) }
     * Logic: username = phoneNumber, password = BCrypt(identityCardNumber)
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
        var userEntity = authService.register(request);
        UserResponse response = userMapper.toResponse(userEntity);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

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
