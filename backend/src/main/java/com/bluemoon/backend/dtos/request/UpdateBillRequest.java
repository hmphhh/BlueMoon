package com.bluemoon.backend.dtos.request;

import java.math.BigDecimal;
import java.time.LocalDate;

import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for updating a bill (FR-6).
 * Only allowed when bill status is UNPAID or OVERDUE.
 */
@Data
@NoArgsConstructor
public class UpdateBillRequest {

    private String title;
    private String description;
    private BigDecimal amount;
    private LocalDate dueDate;
    private String note;
}
