package com.bluemoon.backend.dtos.request.contribution;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for updating a DRAFT contribution campaign.
 * contributionType cannot be changed after creation.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCampaignRequest {

    @NotBlank(message = "Title must not be blank")
    private String title;

    private String description;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;

    private BigDecimal requiredAmount;

    private BigDecimal targetAmount;
}
