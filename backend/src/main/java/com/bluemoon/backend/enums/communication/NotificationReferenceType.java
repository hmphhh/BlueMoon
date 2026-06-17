package com.bluemoon.backend.enums.communication;

/**
 * Identifies the business object a notification refers to.
 * Allows the frontend to navigate to the correct detail page.
 */
public enum NotificationReferenceType {

    BILL,
    INVOICE,
    PAYMENT,
    REPORT,
    CAMPAIGN,
    CONTRIBUTION,
    NONE
}
