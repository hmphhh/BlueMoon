package com.bluemoon.backend.dtos.response.contribution;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import com.bluemoon.backend.enums.contribution.ContributionCampaignStatus;
import com.bluemoon.backend.enums.contribution.ContributionType;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Summary response for listing campaigns.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CampaignSummaryResponse {

    private Long id;
    private String title;
    private ContributionType contributionType;
    private ContributionCampaignStatus status;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal targetAmount;
    private BigDecimal requiredAmount;
    private LocalDateTime createdAt;
}
