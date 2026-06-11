package com.bluemoon.backend.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.bluemoon.backend.dtos.request.PaymentWebhookRequest;
import com.bluemoon.backend.dtos.response.PaymentDetailsResponse;
import com.bluemoon.backend.dtos.response.PaymentSummaryResponse;
import com.bluemoon.backend.entity.InvoiceEntity;
import com.bluemoon.backend.entity.PaymentEntity;
import com.bluemoon.backend.enums.InvoiceStatus;
import com.bluemoon.backend.enums.PaymentFailureReason;
import com.bluemoon.backend.enums.PaymentMethod;
import com.bluemoon.backend.enums.PaymentStatus;
import com.bluemoon.backend.exceptions.ResourceNotFoundException;
import com.bluemoon.backend.repository.InvoiceRepository;
import com.bluemoon.backend.repository.PaymentRepository;

/**
 * Service responsible for processing incoming payment transactions.
 * Owns all payment-related business rules.
 */
@Service
public class PaymentService {

    private static final Logger logger = LoggerFactory.getLogger(PaymentService.class);

    private static final String TRANSFER_TYPE_IN = "in";
    private static final Pattern INVOICE_INFO_PATTERN = Pattern.compile("(PAY-[A-Z0-9]+)\\s+(INV-[\\d-]+)");

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private InvoiceService invoiceService;

    // ============================================================
    // Payment Processing (BR-06, BR-07, BR-08)
    // ============================================================

    /**
     * Process an incoming payment webhook from SePay.
     * Follows the SePay webhook processing flow specification.
     */
    @Transactional
    public PaymentEntity processPayment(PaymentWebhookRequest request) {
        logger.info("Processing webhook: id={}, transferType={}, amount={}",
                request.getId(), request.getTransferType(), request.getTransferAmount());

        // Step 1: Validate transfer type (only process incoming transfers)
        if (!TRANSFER_TYPE_IN.equals(request.getTransferType())) {
            logger.info("Ignoring outgoing transfer: id={}", request.getId());
            return null; // Outgoing transfers are ignored
        }

        // Step 2: Check for duplicate transaction (webhook idempotency)
        Optional<PaymentEntity> existingPayment = paymentRepository.findByTransactionId(request.getId());
        if (existingPayment.isPresent()) {
            logger.info("Duplicate webhook detected: id={}, returning existing payment", request.getId());
            return existingPayment.get();
        }

        // Step 3: Parse content to extract invoice information
        InvoiceInfo invoiceInfo = parseInvoiceInfo(request.getContent());
        if (invoiceInfo == null) {
            logger.warn("Failed to extract invoice information from content: {}", request.getContent());
            // Cannot create payment without invoice info, so this is not recorded
            // Log and ignore this webhook
            return null;
        }

        // Step 4: Find invoice by reference code
        InvoiceEntity invoice = invoiceRepository.findByReferenceCode(invoiceInfo.referenceCode)
                .orElse(null);

        if (invoice == null) {
            logger.warn("Invoice not found for reference code: {}", invoiceInfo.referenceCode);
            // Cannot create a payment record without an invoice
            // Log and ignore this webhook
            return null;
        }

        // Step 5: Double verification - verify invoice code matches
        if (!invoice.getInvoiceCode().equals(invoiceInfo.invoiceCode)) {
            logger.warn("Invoice code mismatch: found={}, extracted={}",
                    invoice.getInvoiceCode(), invoiceInfo.invoiceCode);
            return createFailedPayment(invoice, request, invoiceInfo, PaymentFailureReason.REFERENCE_MISMATCH);
        }

        // Step 6: Validate invoice status and amount
        PaymentFailureReason failureReason = validatePayment(invoice, request.getTransferAmount());

        if (failureReason != null) {
            return createFailedPayment(invoice, request, invoiceInfo, failureReason);
        }

        // Success path
        return createSuccessfulPayment(invoice, request, invoiceInfo);
    }

    /**
     * Create a manual payment record for admin bill-paid flow.
     */
    @Transactional
    public PaymentEntity createManualPayment(InvoiceEntity invoice, BigDecimal amount) {
        PaymentEntity payment = new PaymentEntity();
        payment.setInvoice(invoice);
        payment.setTransactionId(null); // Manual payments have no SePay transaction ID
        payment.setTransactionCode("MANUAL-" + invoice.getReferenceCode());
        payment.setBankReferenceCode(null); // Manual payments have no bank reference
        payment.setAmount(amount);
        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setMethod(PaymentMethod.MANUAL);
        payment.setTransactionTime(LocalDateTime.now());
        return paymentRepository.save(payment);
    }

    // ============================================================
    // Payment Retrieval
    // ============================================================

    /**
     * Get all payments for an invoice (admin).
     */
    public List<PaymentSummaryResponse> getPaymentsByInvoiceId(Long invoiceId) {
        return paymentRepository.findByInvoiceId(invoiceId).stream()
                .map(this::toSummaryResponse)
                .toList();
    }

    /**
     * Get payment details by ID (admin).
     */
    public PaymentDetailsResponse getPaymentDetails(Long paymentId) {
        PaymentEntity payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + paymentId));

        return toDetailsResponse(payment);
    }

    /**
     * Get all payments (admin).
     */
    public List<PaymentSummaryResponse> getAllPayments() {
        return paymentRepository.findAllWithInvoice().stream()
                .map(this::toSummaryResponse)
                .toList();
    }

    // ============================================================
    // Private Helpers
    // ============================================================

    /**
     * Parse invoice information from webhook content.
     * Expected format: "PAY-A1B2C3D4 INV-20260611-001"
     * Returns null if format is invalid.
     */
    private InvoiceInfo parseInvoiceInfo(String content) {
        if (content == null || content.isBlank()) {
            return null;
        }

        Matcher matcher = INVOICE_INFO_PATTERN.matcher(content);
        if (matcher.find()) {
            return new InvoiceInfo(matcher.group(1), matcher.group(2));
        }

        return null;
    }

    /**
     * Validate payment against invoice rules.
     * Returns null if valid, or the failure reason if invalid.
     */
    private PaymentFailureReason validatePayment(InvoiceEntity invoice, BigDecimal amount) {
        switch (invoice.getStatus()) {
            case EXPIRED:
                return PaymentFailureReason.INVOICE_EXPIRED;
            case CANCELLED:
                return PaymentFailureReason.INVOICE_CANCELLED;
            case PAID:
                return PaymentFailureReason.INVOICE_ALREADY_PAID;
            case PENDING:
                break;
            default:
                return PaymentFailureReason.INVALID_REFERENCE;
        }

        // Amount validation
        int comparison = amount.compareTo(invoice.getTotalAmount());
        if (comparison < 0) {
            return PaymentFailureReason.AMOUNT_TOO_LOW;
        }
        if (comparison > 0) {
            return PaymentFailureReason.AMOUNT_TOO_HIGH;
        }

        return null; // valid
    }

    private PaymentEntity createSuccessfulPayment(InvoiceEntity invoice, PaymentWebhookRequest request, InvoiceInfo invoiceInfo) {
        PaymentEntity payment = new PaymentEntity();
        payment.setInvoice(invoice);
        payment.setTransactionId(request.getId());
        payment.setTransactionCode("AUTO-" + request.getId() + "-" + invoice.getInvoiceCode());
        payment.setBankReferenceCode(request.getReferenceCode());
        payment.setAmount(request.getTransferAmount());
        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setMethod(PaymentMethod.AUTOMATIC);
        payment.setTransactionTime(request.getTransactionDate());

        payment = paymentRepository.save(payment);

        // Settle the invoice and bills
        invoiceService.markAsPaid(invoice.getId());

        logger.info("Payment SUCCESS for invoice {}: transactionId={}, code={}",
                invoice.getInvoiceCode(), request.getId(), payment.getTransactionCode());

        return payment;
    }

    private PaymentEntity createFailedPayment(InvoiceEntity invoice, PaymentWebhookRequest request, 
                                               InvoiceInfo invoiceInfo, PaymentFailureReason reason) {
        PaymentEntity payment = new PaymentEntity();
        payment.setInvoice(invoice);
        payment.setTransactionId(request.getId());
        payment.setTransactionCode("AUTO-" + request.getId() + "-" + invoice.getInvoiceCode());
        payment.setBankReferenceCode(request.getReferenceCode());
        payment.setAmount(request.getTransferAmount());
        payment.setStatus(PaymentStatus.FAILED);
        payment.setFailureReason(reason);
        payment.setTransactionTime(request.getTransactionDate());

        payment = paymentRepository.save(payment);

        logger.warn("Payment FAILED for invoice {}: reason={}, transactionId={}",
                invoice.getInvoiceCode(), reason, request.getId());

        return payment;
    }

    // ============================================================
    // DTO Mapping
    // ============================================================

    private PaymentSummaryResponse toSummaryResponse(PaymentEntity payment) {
        return new PaymentSummaryResponse(
                payment.getId(),
                payment.getTransactionCode(),
                payment.getStatus(),
                payment.getMethod(),
                payment.getAmount(),
                payment.getTransactionTime()
        );
    }

    private PaymentDetailsResponse toDetailsResponse(PaymentEntity payment) {
        return new PaymentDetailsResponse(
                payment.getId(),
                payment.getInvoice().getId(),
                payment.getTransactionCode(),
                payment.getStatus(),
                payment.getMethod(),
                payment.getAmount(),
                payment.getFailureReason(),
                payment.getTransactionTime(),
                payment.getCreatedAt()
        );
    }

    // ============================================================
    // Helper Class
    // ============================================================

    /**
     * Simple holder for parsed invoice information from webhook content.
     */
    private static class InvoiceInfo {
        final String referenceCode;
        final String invoiceCode;

        InvoiceInfo(String referenceCode, String invoiceCode) {
            this.referenceCode = referenceCode;
            this.invoiceCode = invoiceCode;
        }
    }
}
