package com.bluemoon.backend.enums.billing;

/**
 * Distinguishes between bill-payment invoices and contribution invoices.
 * An invoice must be exactly one type — it cannot belong to both a Bill and a Contribution.
 */
public enum InvoiceType {
    BILL,
    CONTRIBUTION
}
