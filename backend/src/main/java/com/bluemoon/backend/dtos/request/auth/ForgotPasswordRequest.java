package com.bluemoon.backend.dtos.request.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Request body for initiating forgot password flow (email request).
 */
@Data
public class ForgotPasswordRequest {

    @Email(message = "Email must be valid")
    @NotBlank(message = "Email is required")
    private String email;
}
