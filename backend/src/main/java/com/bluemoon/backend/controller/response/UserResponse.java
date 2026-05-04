package com.bluemoon.backend.controller.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * Public API response format for user data.
 * Controls exactly what is sent over the wire.
 */
@Data
public class UserResponse {

    private Long id;
    private String username;
    private String fullName;
    private String role;
    private String email;
    private String phoneNumber;
    private String identityCardNumber;
    private String avatarUrl;

    @JsonProperty("isVerified")
    private boolean isVerified;

    private String apartmentNumber;
}
