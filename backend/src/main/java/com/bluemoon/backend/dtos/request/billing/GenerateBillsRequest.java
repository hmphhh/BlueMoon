package com.bluemoon.backend.dtos.request.billing;

import java.time.LocalDate;
import java.util.List;

import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for generating bills from a template (FR-3).
 */
@Data
@NoArgsConstructor
public class GenerateBillsRequest {

    private Long templateId;
    private List<Long> apartmentIds;
    private LocalDate dueDate;
}
