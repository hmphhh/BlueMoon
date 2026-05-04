package com.bluemoon.backend.controller.response;

import lombok.Data;

/**
 * Public API response format for apartment data.
 */
@Data
public class ApartmentResponse {

    private Long id;
    private String apartmentNumber;
}
