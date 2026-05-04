package com.bluemoon.backend.service.dto;

import lombok.Data;

/**
 * Business-layer representation of a User.
 * Used for passing user data between service and controller layers.
 */
@Data
public class UserDTO {

    private Long id;
    private String username;
    private String fullName;
    private String role;
    private String email;
    private String phoneNumber;
    private String identityCardNumber;
    private String avatarUrl;
    private boolean isVerified;
    private String apartmentNumber;
}
