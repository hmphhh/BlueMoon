package com.bluemoon.backend.dtos.response;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for detailed user view (GET /api/users/{userId}).
 * Flat structure with nested apartment info.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDetailsResponse {

    private Long id;
    private String username;
    private String email;
    private String role;
    private Boolean verified;
    private LocalDateTime createdAt;

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
