package com.bluemoon.backend.dtos.request.apartment;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApartmentRequest {

    private String number;
    private Integer floor;
    private Double area;
    private String type;
}
