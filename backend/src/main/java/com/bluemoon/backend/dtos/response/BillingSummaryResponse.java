package com.bluemoon.backend.dtos.response;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for billing summary within apartment responses.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BillingSummaryResponse {

    private Long unpaidCount;
    private Long overdueCount;
    private BigDecimal totalOutstanding;
}
