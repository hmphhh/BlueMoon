package com.bluemoon.backend.service.dto;

import lombok.Data;

/**
 * Business-layer representation of an Apartment.
 */
@Data
public class ApartmentDTO {

    private Long id;
    private String apartmentNumber;
}
