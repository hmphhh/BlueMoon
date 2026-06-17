package com.bluemoon.backend.dtos.response.contribution;
import com.bluemoon.backend.dtos.response.auth.UserSummaryResponse;


import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import com.bluemoon.backend.enums.contribution.ContributionCampaignStatus;
import com.bluemoon.backend.enums.contribution.ContributionType;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Detailed response for a single campaign, including description and creator.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CampaignDetailResponse {

    private Long id;
    private String title;
    private String description;
    private ContributionType contributionType;
    private ContributionCampaignStatus status;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal targetAmount;
    private BigDecimal requiredAmount;
    private UserSummaryResponse createdBy;
    private LocalDateTime createdAt;
}
