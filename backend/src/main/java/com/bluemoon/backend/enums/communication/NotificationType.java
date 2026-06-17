package com.bluemoon.backend.enums.communication;

/**
 * Classification of notifications.
 * Each type maps to a "Displayed Source" on the frontend:
 *   ANNOUNCEMENT, URGENT_ANNOUNCEMENT -> Management
 *   BILL_CREATED, INVOICE_EXPIRED, PAYMENT_SUCCESS, SYSTEM_ERROR -> System
 *   BILL_CANCELLED, BILL_AMOUNT_UPDATED, BILL_DUE_DATE_UPDATED,
 *   PAYMENT_ACCEPTED, REPORT_APPROVED, REPORT_REJECTED -> Management
 *   REPORT_CREATED, REPORT_UPDATED -> User
 */
public enum NotificationType {

    // Announcements
    ANNOUNCEMENT,
    URGENT_ANNOUNCEMENT,

    // Bill events
    BILL_CREATED,
    BILL_CANCELLED,
    BILL_AMOUNT_UPDATED,
    BILL_DUE_DATE_UPDATED,

    // Invoice events
    INVOICE_EXPIRED,

    // Payment events
    PAYMENT_SUCCESS,
    PAYMENT_ACCEPTED,

    // Report events
    REPORT_CREATED,
    REPORT_UPDATED,
    REPORT_APPROVED,
    REPORT_REJECTED,

    // Contribution events
    CAMPAIGN_LAUNCHED,
    CAMPAIGN_COMPLETED,
    CONTRIBUTION_PAID,

    // System events
    SYSTEM_ERROR
}
