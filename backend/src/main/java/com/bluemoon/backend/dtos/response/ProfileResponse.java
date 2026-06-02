package com.bluemoon.backend.dtos.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for current user profile (GET /api/users/me).
 * Same flat structure as UserDetailsResponse.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProfileResponse {

    private Long id;
    private String username;
    private String email;
    private String role;
    private Boolean verified;

    // Resident fields
    private String fullName;
    private String phone;
    private String dateOfBirth;
    private String gender;
    private String idNumber;
    private String relationship;
    private String status;

    // Apartment info
    private ApartmentDto apartment;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ApartmentDto {
        private Long id;
        private String number;
    }
}
