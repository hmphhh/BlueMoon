package com.bluemoon.backend.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.bluemoon.backend.config.SepayConfig;
import com.bluemoon.backend.entity.InvoiceEntity;

/**
 * Service responsible for generating QR code payment data.
 * Contains no invoice or payment business rules.
 */
@Service
public class QrCodeService {

    @Autowired
    private SepayConfig sepayConfig;

    /**
     * Build the transfer description containing the reference code.
     * The reference code is essential for matching incoming bank transactions.
     */
    public String buildTransferDescription(String referenceCode, String invoiceCode) {
        return referenceCode + " " + invoiceCode;
    }

    /**
     * Generate the full QR code URL for an invoice.
     */
    public String generateQrCodeUrl(InvoiceEntity invoice) {
        String description = buildTransferDescription(
            invoice.getReferenceCode(),
            invoice.getInvoiceCode()
        );
        String encodedDescription = URLEncoder.encode(description, StandardCharsets.UTF_8);
        String amount = invoice.getTotalAmount().setScale(0, RoundingMode.DOWN).toPlainString();

        return sepayConfig.generateQrCodeUrl(amount, encodedDescription);
    }
}
