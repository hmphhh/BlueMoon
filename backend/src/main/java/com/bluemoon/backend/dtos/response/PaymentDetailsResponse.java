package com.bluemoon.backend.dtos.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.bluemoon.backend.enums.PaymentFailureReason;
import com.bluemoon.backend.enums.PaymentMethod;
import com.bluemoon.backend.enums.PaymentStatus;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Full payment details response.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentDetailsResponse {

    private Long id;
    private Long invoiceId;
    private String transactionCode;
    private PaymentStatus status;
    private PaymentMethod method;
    private BigDecimal amount;
    private PaymentFailureReason failureReason;
    private LocalDateTime transactionTime;
    private LocalDateTime createdAt;
}
