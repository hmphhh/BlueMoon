package com.bluemoon.backend.controller.request;

import jakarta.validation.constraints.Email;
import lombok.Data;

/**
 * Request body for updating user profile.
 * Only these fields are allowed to be updated.
 */
@Data
public class UpdateProfileRequest {

    private String fullName;

    @Email(message = "Email must be valid")
    private String email;

    private String avatarUrl;
}
