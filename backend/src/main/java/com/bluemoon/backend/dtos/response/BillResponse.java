package com.bluemoon.backend.dtos.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.Data;

/**
 * Public API response format for bill data.
 */
@Data
public class BillResponse {

    private Long id;
    private String apartmentNumber;
    private String billType;
    private BigDecimal amount;
    private String description;
    private LocalDate dueDate;
    private String status;
    private LocalDateTime createdAt;
    private String createdByName;
}
