package com.bluemoon.backend.dtos.response.apartment;

import com.bluemoon.backend.enums.apartment.ApartmentStatus;
import com.bluemoon.backend.enums.apartment.ApartmentType;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Intermediate JPQL projection for apartment + resident count.
 * Used to avoid N+1 queries, merged with billing summary in service layer.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApartmentResidentsSummaryResponse {

    private Long id;
    private String apartmentNumber;
    private Integer floor;
    private Double area;
    private ApartmentStatus status;
    private ApartmentType type;
    private Long residentCount;
}
