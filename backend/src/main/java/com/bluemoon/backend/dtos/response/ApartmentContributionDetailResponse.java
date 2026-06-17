package com.bluemoon.backend.dtos.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import com.bluemoon.backend.enums.ApartmentContributionStatus;
import com.bluemoon.backend.enums.ContributionCampaignStatus;
import com.bluemoon.backend.enums.ContributionType;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Detailed response for a single apartment contribution, including campaign info,
 * apartment info, and per-user contribution breakdown.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApartmentContributionDetailResponse {

    private Long id;

    private CampaignInfo campaign;
    private ApartmentInfo apartment;

    private BigDecimal requiredAmount;
    private BigDecimal collectedAmount;
    private ApartmentContributionStatus status;
    private List<ContributorResponse> contributors;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CampaignInfo {
        private Long id;
        private String title;
        private ContributionType type;
        private ContributionCampaignStatus status;
        private LocalDate startDate;
        private LocalDate endDate;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ApartmentInfo {
        private Long id;
        private String apartmentNumber;
    }
}
