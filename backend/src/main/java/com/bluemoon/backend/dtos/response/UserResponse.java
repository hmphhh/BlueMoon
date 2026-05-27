package com.bluemoon.backend.dtos.response;

import java.time.LocalDateTime;

import com.bluemoon.backend.enums.UserRole;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Public API response format for user data.
 * Controls exactly what is sent over the wire.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {

    private Long id;
    private String username;
    private String email;
    private UserRole role;

    @JsonProperty("verified")
    private boolean verified;

    @JsonProperty("createdAt")
    private LocalDateTime createdAt;

    @JsonProperty("linked")
    private boolean linked;
}
