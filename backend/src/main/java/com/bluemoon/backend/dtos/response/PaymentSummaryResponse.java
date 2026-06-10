package com.bluemoon.backend.dtos.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.bluemoon.backend.enums.PaymentMethod;
import com.bluemoon.backend.enums.PaymentStatus;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Payment summary for list views.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentSummaryResponse {

    private Long id;
    private String transactionCode;
    private PaymentStatus status;
    private PaymentMethod method;
    private BigDecimal amount;
    private LocalDateTime transactionTime;
}
