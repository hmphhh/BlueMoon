package com.bluemoon.backend.dtos.request;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for incoming payment webhook from SePay payment provider.
 * Maps directly to the official SePay webhook payload.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentWebhookRequest {

    @NotNull(message = "id must not be null")
    private Long id;

    @NotBlank(message = "gateway must not be blank")
    private String gateway;

    @NotNull(message = "transactionDate must not be null")
    private LocalDateTime transactionDate;

    @NotBlank(message = "accountNumber must not be blank")
    private String accountNumber;

    private String subAccount;

    private String code;

    @NotBlank(message = "content must not be blank")
    private String content;

    @NotBlank(message = "transferType must not be blank")
    private String transferType;

    private String description;

    @NotNull(message = "transferAmount must not be null")
    @Positive(message = "transferAmount must be positive")
    private BigDecimal transferAmount;

    private BigDecimal accumulated;

    private String referenceCode;
}
