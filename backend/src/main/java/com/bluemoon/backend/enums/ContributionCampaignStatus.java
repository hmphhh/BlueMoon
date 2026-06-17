package com.bluemoon.backend.enums;

/**
 * Campaign lifecycle status.
 *
 * State transitions:
 *   DRAFT  → ACTIVE    (launch)
 *   DRAFT  → CANCELED  (cancel before launch)
 *   ACTIVE → COMPLETED (complete)
 */
public enum ContributionCampaignStatus {
    DRAFT,
    ACTIVE,
    COMPLETED,
    CANCELED
}
