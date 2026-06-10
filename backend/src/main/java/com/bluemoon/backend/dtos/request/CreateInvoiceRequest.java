package com.bluemoon.backend.dtos.request;

import java.util.List;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for creating an invoice from selected bills.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateInvoiceRequest {

    @NotEmpty(message = "billIds must not be empty")
    private List<Long> billIds;
}
