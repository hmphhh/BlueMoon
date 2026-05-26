package com.bluemoon.backend.dtos.response;

import lombok.AllArgsConstructor;
import lombok.Data;

import com.bluemoon.backend.enums.UserRole;
/**
 * Login response containing JWT token and basic user info.
 */
@Data
@AllArgsConstructor
public class LoginResponse {
    private String token;
    private Long id;
    private String username;
    private UserRole role;
}
