package com.bluemoon.backend.enums;

/**
 * Enum for payment failure reasons.
 * Used when PaymentStatus is FAILED to record why.
 */
public enum PaymentFailureReason {
    /** No invoice matches the provided reference code. */
    INVOICE_NOT_FOUND,

    /** Invoice already expired before payment arrived. */
    INVOICE_EXPIRED,

    /** Invoice was cancelled before payment arrived. */
    INVOICE_CANCELLED,

    /** Invoice was previously settled successfully. */
    INVOICE_ALREADY_PAID,

    /** Transferred amount is less than invoice amount. */
    AMOUNT_TOO_LOW,

    /** Transferred amount is greater than invoice amount. */
    AMOUNT_TOO_HIGH,

    /** Reference code format is invalid or unreadable. */
    INVALID_REFERENCE,

    /** Invoice code does not belong to extracted reference code. */
    REFERENCE_MISMATCH
}
