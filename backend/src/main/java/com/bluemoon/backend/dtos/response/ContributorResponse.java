package com.bluemoon.backend.dtos.response;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Per-user contribution breakdown within an ApartmentContribution.
 * Calculated from PAID invoices grouped by createdBy user.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ContributorResponse {

    private Long userId;
    private String fullName;
    private BigDecimal totalPaid;
}
