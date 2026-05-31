package com.bluemoon.backend.dtos.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Request DTO for admin resetting a user's password.
 */
@Data
public class ResetUserPasswordRequest {

    @NotBlank(message = "Password is required")
    private String password;
}
