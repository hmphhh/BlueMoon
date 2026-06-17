package com.bluemoon.backend.dtos.response.auth;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for paginated user list (GET /api/users).
 * Matches the spec's list view fields.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {

    private Long id;
    private String username;
    private String fullName;
    private String idNumber;
    private String phone;
    private String role;
    private String status;
    private String apartmentNumber;
}
