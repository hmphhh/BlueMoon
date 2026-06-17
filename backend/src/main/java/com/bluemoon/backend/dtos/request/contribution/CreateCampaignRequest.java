package com.bluemoon.backend.dtos.request.contribution;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.bluemoon.backend.enums.contribution.ContributionType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for creating a new contribution campaign.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateCampaignRequest {

    @NotBlank(message = "Title must not be blank")
    private String title;

    private String description;

    @NotNull(message = "Contribution type is required")
    private ContributionType contributionType;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;

    private BigDecimal requiredAmount;

    private BigDecimal targetAmount;
}
