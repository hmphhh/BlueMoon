package com.bluemoon.backend.dtos.response.billing;
import com.bluemoon.backend.dtos.response.auth.UserSummaryResponse;


import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.bluemoon.backend.enums.billing.InvoiceStatus;
import com.bluemoon.backend.enums.billing.InvoiceType;

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
    private InvoiceType invoiceType;
    private InvoiceStatus status;
    private BigDecimal totalAmount;
    private UserSummaryResponse createdBy;
    private LocalDateTime createdAt;
    private List<Long> billIds;
    private List<String> billTitles;
    private Long apartmentContributionId;
    private Long campaignId;
    private String campaignTitle;
}
