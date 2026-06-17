package com.bluemoon.backend.dtos.response.contribution;

import java.math.BigDecimal;

import com.bluemoon.backend.enums.contribution.ApartmentContributionStatus;
import com.bluemoon.backend.enums.contribution.ContributionCampaignStatus;
import com.bluemoon.backend.enums.contribution.ContributionType;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for the /me endpoint — resident's own apartment contributions.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MyContributionResponse {

    private Long id;
    private Long campaignId;
    private String campaignTitle;
    private ContributionType type;
    private BigDecimal collectedAmount;
    private BigDecimal requiredAmount;
    private ApartmentContributionStatus status;
    private ContributionCampaignStatus campaignStatus;
}
