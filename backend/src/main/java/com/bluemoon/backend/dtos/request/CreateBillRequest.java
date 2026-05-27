package com.bluemoon.backend.dtos.request;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Request body for creating a new bill.
 */
@Data
public class CreateBillRequest {

    @NotBlank(message = "Apartment number is required")
    private String apartmentNumber;

    @NotBlank(message = "Bill type is required")
    private String billType;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
    private BigDecimal amount;

    private String description;

    @NotNull(message = "Due date is required")
    private LocalDate dueDate;
}
