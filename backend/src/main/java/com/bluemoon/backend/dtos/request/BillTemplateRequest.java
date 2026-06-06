package com.bluemoon.backend.dtos.request;

import java.math.BigDecimal;

import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for creating/updating a bill template.
 */
@Data
@NoArgsConstructor
public class BillTemplateRequest {

    private String name;
    private String description;
    private BigDecimal defaultAmount;
}
