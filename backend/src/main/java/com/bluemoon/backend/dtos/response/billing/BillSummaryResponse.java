package com.bluemoon.backend.dtos.response.billing;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.bluemoon.backend.enums.billing.BillStatus;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for bill list views (admin and user).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BillSummaryResponse {

    private Long id;
    private Long apartmentId;
    private String apartmentNumber;
    private String title;
    private BigDecimal amount;
    private BillStatus status;
    private LocalDate dueDate;
}
