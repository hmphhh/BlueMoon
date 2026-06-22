package com.bluemoon.backend.dtos.response.billing;
import com.bluemoon.backend.dtos.response.auth.UserSummaryResponse;


import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.bluemoon.backend.enums.billing.InvoiceStatus;
import com.bluemoon.backend.enums.billing.InvoiceType;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Full invoice response returned when creating or viewing invoice details.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceResponse {

    private Long id;
    private String invoiceCode;
    private String referenceCode;
    private InvoiceType invoiceType;
    private InvoiceStatus status;
    private BigDecimal totalAmount;
    private UserSummaryResponse createdBy;
    private String qrCodeUrl;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private LocalDateTime paidAt;
    private LocalDateTime cancelledAt;
}
