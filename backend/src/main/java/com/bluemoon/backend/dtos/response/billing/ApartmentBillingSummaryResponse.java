package com.bluemoon.backend.dtos.response.billing;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Intermediate JPQL projection for apartment + billing summary.
 * Used to avoid N+1 queries, merged with resident summary in service layer.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApartmentBillingSummaryResponse {

    private Long apartmentId;
    private Long unpaidCount;
    private Long overdueCount;
    private BigDecimal totalOutstanding;
}
