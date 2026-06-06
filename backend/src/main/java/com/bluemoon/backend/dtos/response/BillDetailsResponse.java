package com.bluemoon.backend.dtos.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import com.bluemoon.backend.enums.BillStatus;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for bill details (GET /api/bills/{billId}).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BillDetailsResponse {

    private Long id;
    private Long apartmentId;
    private String apartmentNumber;
    private String title;
    private String description;
    private BigDecimal amount;
    private LocalDate dueDate;
    private BillStatus status;
    private LocalDateTime paidAt;
    private LocalDateTime createdAt;
}
