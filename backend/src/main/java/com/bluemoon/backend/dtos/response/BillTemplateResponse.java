package com.bluemoon.backend.dtos.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for bill template details.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BillTemplateResponse {

    private Long id;
    private String name;
    private String description;
    private BigDecimal defaultAmount;
    private LocalDateTime createdAt;
}
