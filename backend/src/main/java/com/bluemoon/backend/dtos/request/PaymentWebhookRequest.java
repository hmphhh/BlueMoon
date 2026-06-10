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
 * Request DTO for incoming payment webhook from payment provider.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentWebhookRequest {

    @NotBlank(message = "transactionCode must not be blank")
    private String transactionCode;

    @NotBlank(message = "referenceCode must not be blank")
    private String referenceCode;

    @NotNull(message = "amount must not be null")
    @Positive(message = "amount must be positive")
    private BigDecimal amount;

    @NotNull(message = "transactionTime must not be null")
    private LocalDateTime transactionTime;
}
