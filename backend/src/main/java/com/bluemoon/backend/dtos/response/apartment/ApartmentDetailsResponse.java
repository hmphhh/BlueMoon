package com.bluemoon.backend.dtos.response.apartment;

import com.bluemoon.backend.enums.apartment.ApartmentStatus;
import com.bluemoon.backend.enums.apartment.ApartmentType;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for apartment details (GET /api/apartments/{apartmentId}).
 * Includes list of assigned users.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApartmentDetailsResponse {

    private Long id;
    private String apartmentNumber;
    private Integer floor;
    private Double area;
    private ApartmentStatus status;
    private ApartmentType type;
    private Integer userCount;
    private java.util.List<UserDto> users;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserDto {
        private Long id;
        private String username;
        private String fullName;
        private String idNumber;
        private String phone;
        private String status;
        private String role;
    }
}
