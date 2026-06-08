package com.bluemoon.backend.dtos.request;

import java.math.BigDecimal;
import java.time.LocalDate;

import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for creating a custom bill (FR-4).
 */
@Data
@NoArgsConstructor
public class CreateBillRequest {

    private Long apartmentId;
    private String title;
    private String description;
    private BigDecimal amount;
    private LocalDate dueDate;
}
