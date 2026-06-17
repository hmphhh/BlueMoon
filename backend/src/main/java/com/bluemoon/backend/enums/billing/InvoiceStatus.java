package com.bluemoon.backend.enums.billing;

/**
 * Enum for invoice lifecycle status.
 *
 * State flow:
 * PENDING   -> PAID, EXPIRED, CANCELLED
 * PAID      -> Terminal
 * EXPIRED   -> Terminal
 * CANCELLED -> Terminal
 */
public enum InvoiceStatus {
    PENDING,
    PAID,
    EXPIRED,
    CANCELLED
}
