package com.bluemoon.backend.enums;

/**
 * Enum for payment creation method.
 */
public enum PaymentMethod {
    /** Payment created via processing webhooks from payment provider. */
    AUTOMATIC,

    /** Payment created via marking bills paid manually by admin. */
    MANUAL
}
