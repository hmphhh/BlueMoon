package com.bluemoon.backend.dtos.response;

import com.bluemoon.backend.enums.ApartmentStatus;
import com.bluemoon.backend.enums.ApartmentType;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for apartment list (GET /api/apartments).
 * Includes userCount.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApartmentResponse {

    private Long id;
    private String apartmentNumber;
    private Integer floor;
    private Double area;
    private ApartmentStatus status;
    private ApartmentType type;
    private Long userCount;
}
