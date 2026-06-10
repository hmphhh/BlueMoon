package com.bluemoon.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import lombok.Getter;
import lombok.Setter;

/**
 * Configuration for Sepay payment provider integration.
 * Properties are loaded from application.properties with the prefix 'sepay'.
 */
@Configuration
@ConfigurationProperties(prefix = "sepay")
@Getter
@Setter
public class SepayConfig {

    /** Bank account number for receiving payments. */
    private String bankAccount;

    /** Bank code (e.g., MB, VCB, TCB). */
    private String bankCode;

    /** Account holder name displayed on QR. */
    private String accountName;

    /** API key for validating incoming webhook requests. */
    private String webhookApiKey;

    /**
     * HMAC-SHA256 secret key for webhook signature verification.
     * (Alternative to API key authentication)
     */
    // private String webhookHmacSecret;

    /** Invoice expiration duration in minutes. */
    private int invoiceExpirationMinutes = 15;

    /**
     * Generate the QR code URL for a given invoice.
     */
    public String generateQrCodeUrl(String amount, String description) {
        return String.format(
            "https://qr.sepay.vn/img?acc=%s&bank=%s&amount=%s&des=%s",
            bankAccount, bankCode, amount, description
        );
    }
}
