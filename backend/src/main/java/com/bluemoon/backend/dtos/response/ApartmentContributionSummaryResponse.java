package com.bluemoon.backend.dtos.response;

import java.math.BigDecimal;

import com.bluemoon.backend.enums.ApartmentContributionStatus;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Summary response for listing apartment contributions (admin view).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApartmentContributionSummaryResponse {

    private Long id;
    private Long campaignId;
    private String campaignTitle;
    private Long apartmentId;
    private String apartmentNumber;
    private BigDecimal collectedAmount;
    private BigDecimal requiredAmount;
    private ApartmentContributionStatus status;
}
