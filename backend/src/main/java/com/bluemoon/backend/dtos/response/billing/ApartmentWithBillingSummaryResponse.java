package com.bluemoon.backend.dtos.response.billing;

import com.bluemoon.backend.enums.apartment.ApartmentStatus;
import com.bluemoon.backend.enums.apartment.ApartmentType;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for apartment with resident count and billing summary.
 * Used by GET /api/apartments, GET /api/apartments/{id}, and GET /api/apartments/me.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApartmentWithBillingSummaryResponse {

    private Long id;
    private String apartmentNumber;
    private Integer floor;
    private Double area;
    private ApartmentStatus status;
    private ApartmentType type;
    private Long residentCount;
    private BillingSummaryResponse billingSummary;
}
