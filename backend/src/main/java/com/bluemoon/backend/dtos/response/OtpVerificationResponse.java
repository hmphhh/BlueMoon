package com.bluemoon.backend.dtos.response;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Response for successful OTP verification.
 */
@Data
@AllArgsConstructor
public class OtpVerificationResponse {

    private String resetToken; // UUID string to be used for password reset
    private String message;
}
