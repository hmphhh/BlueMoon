package com.bluemoon.backend.dtos.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.bluemoon.backend.enums.InvoiceStatus;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Summary invoice response for list views.
 * Note: createdBy is only included for admin queries.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceSummaryResponse {

    private Long id;
    private String invoiceCode;
    private InvoiceStatus status;
    private BigDecimal totalAmount;
    private UserSummaryResponse createdBy;
    private LocalDateTime createdAt;
}
