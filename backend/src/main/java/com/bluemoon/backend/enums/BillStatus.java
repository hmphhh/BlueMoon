package com.bluemoon.backend.enums;

/**
 * Enum for bill payment status.
 *
 * State flow:
 * UNPAID  -> OVERDUE, PAID, CANCELLED
 * OVERDUE -> PAID, CANCELLED
 * PAID    -> Terminal
 * CANCELLED -> Terminal
 */
public enum BillStatus {
    UNPAID,
    OVERDUE,
    PAID,
    CANCELLED
}
