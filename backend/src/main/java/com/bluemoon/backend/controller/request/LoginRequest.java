package com.bluemoon.backend.controller.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Request body for user login.
 */
@Data
public class LoginRequest {

    @NotBlank(message = "Username is required")
    private String username;

    @NotBlank(message = "Password is required")
    private String password;
}
