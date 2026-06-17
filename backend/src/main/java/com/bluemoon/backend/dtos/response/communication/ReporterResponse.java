package com.bluemoon.backend.dtos.response.communication;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Reporter info for admin report listing (includes apartment number).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReporterResponse {

    private Long id;

    private String fullName;

    private String apartmentNumber;
}
