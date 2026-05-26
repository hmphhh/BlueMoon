package com.bluemoon.backend.dtos.response;

import com.bluemoon.backend.enums.ApartmentStatus;
import com.bluemoon.backend.enums.ApartmentType;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Public API response format for apartment data.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApartmentResponse {

    private Long id;
    private String number;
    private Integer floor;
    private Double area;
    private ApartmentStatus status;
    private ApartmentType type;
    private Integer residentCount;
}
