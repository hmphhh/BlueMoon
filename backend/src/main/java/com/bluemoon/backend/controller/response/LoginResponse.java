package com.bluemoon.backend.controller.response;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Login response containing JWT token and basic user info.
 */
@Data
@AllArgsConstructor
public class LoginResponse {

    private String token;
    private Long id;
    private String username;
    private String role;
    private String fullName;
    private String apartmentNumber;
}
