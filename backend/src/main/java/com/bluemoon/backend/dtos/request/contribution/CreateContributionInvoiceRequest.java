package com.bluemoon.backend.dtos.request.contribution;

import java.math.BigDecimal;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for creating a contribution invoice.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateContributionInvoiceRequest {

    @NotNull(message = "Apartment contribution ID is required")
    private Long apartmentContributionId;

    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be greater than zero")
    private BigDecimal amount;
}
