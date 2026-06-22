package com.bluemoon.backend.dtos.request.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Request body for Google Sign-In.
 * Contains the Google ID token from the frontend (Google Identity Services).
 */
@Data
public class GoogleLoginRequest {

    @NotBlank(message = "Google ID token must not be blank")
    private String idToken;
}
