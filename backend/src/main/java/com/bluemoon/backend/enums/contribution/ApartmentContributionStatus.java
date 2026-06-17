package com.bluemoon.backend.enums.contribution;

/**
 * Progress status for an apartment's participation in a contribution campaign.
 *
 * NOT_STARTED — collectedAmount = 0
 * STARTED     — collectedAmount > 0
 * COMPLETED   — collectedAmount >= requiredAmount (primarily for MANDATORY campaigns)
 */
public enum ApartmentContributionStatus {
    NOT_STARTED,
    STARTED,
    COMPLETED
}
