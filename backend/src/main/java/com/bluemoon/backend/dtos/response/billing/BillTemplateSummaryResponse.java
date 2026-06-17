package com.bluemoon.backend.dtos.response.billing;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for bill template list (compact view).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BillTemplateSummaryResponse {

    private Long id;
    private String name;
    private BigDecimal defaultAmount;
}
