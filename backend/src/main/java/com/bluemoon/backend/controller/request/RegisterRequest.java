package com.bluemoon.backend.controller.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Request body for admin-initiated user registration.
 */
@Data
public class RegisterRequest {

    @NotBlank(message = "Phone number is required")
    private String phoneNumber;

    @NotBlank(message = "Identity card number (CCCD) is required")
    private String identityCardNumber;

    private String apartmentNumber; // optional for ADMIN role

    private String role; // optional, default USER
}
