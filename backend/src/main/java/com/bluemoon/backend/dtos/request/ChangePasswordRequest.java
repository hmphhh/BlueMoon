package com.bluemoon.backend.dtos.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Request body for changing user password.
 */
@Data
public class ChangePasswordRequest {

    @NotBlank(message = "Current password is required")
    private String currentPassword;

    @NotBlank(message = "New password is required")
    private String newPassword;

    @NotBlank(message = "Confirm password is required")
    private String confirmPassword;
}
