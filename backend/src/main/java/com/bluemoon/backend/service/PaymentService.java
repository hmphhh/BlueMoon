package com.bluemoon.backend.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

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
     * Process an incoming payment from a webhook.
     * Validates the payment against the invoice and either succeeds or records failure.
     */
    @Transactional
    public PaymentEntity processPayment(PaymentWebhookRequest request) {
        // Check for duplicate transaction (BR-08)
        if (paymentRepository.existsByTransactionCode(request.getTransactionCode())) {
            logger.warn("Duplicate transaction code: {}", request.getTransactionCode());
            // Find the invoice by reference code to create a failed record
            InvoiceEntity invoice = invoiceRepository.findByReferenceCode(request.getReferenceCode())
                    .orElse(null);
            if (invoice != null) {
                return createFailedPayment(invoice, request, PaymentFailureReason.DUPLICATE_TRANSACTION);
            }
            // If invoice not found either, just create with the first found or skip
            throw new RuntimeException("Duplicate transaction and invoice not found for reference: " + request.getReferenceCode());
        }

        // Validate reference code format
        if (request.getReferenceCode() == null || !request.getReferenceCode().startsWith("PAY-")) {
            logger.warn("Invalid reference code format: {}", request.getReferenceCode());
            // Cannot link to an invoice, but we need to record it
            // Since we can't create without an invoice, log and return
            throw new RuntimeException("Invalid reference code: " + request.getReferenceCode());
        }

        // Find invoice by reference code
        InvoiceEntity invoice = invoiceRepository.findByReferenceCode(request.getReferenceCode())
                .orElse(null);

        if (invoice == null) {
            logger.warn("Invoice not found for reference code: {}", request.getReferenceCode());
            // We can't create a payment record without an invoice in the current schema
            // This is handled at webhook level
            throw new ResourceNotFoundException("Invoice not found for reference code: " + request.getReferenceCode());
        }

        // Validate invoice status
        PaymentFailureReason failureReason = validatePayment(invoice, request.getAmount());

        if (failureReason != null) {
            return createFailedPayment(invoice, request, failureReason);
        }

        // Success path
        return createSuccessfulPayment(invoice, request);
    }

    /**
     * Create a manual payment record for admin bill-paid flow.
     */
    @Transactional
    public PaymentEntity createManualPayment(InvoiceEntity invoice, BigDecimal amount) {
        PaymentEntity payment = new PaymentEntity();
        payment.setInvoice(invoice);
        payment.setTransactionCode("MANUAL-" + invoice.getReferenceCode());
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

    private PaymentEntity createSuccessfulPayment(InvoiceEntity invoice, PaymentWebhookRequest request) {
        PaymentEntity payment = new PaymentEntity();
        payment.setInvoice(invoice);
        payment.setTransactionCode(request.getTransactionCode());
        payment.setAmount(request.getAmount());
        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setMethod(PaymentMethod.AUTOMATIC);
        payment.setTransactionTime(request.getTransactionTime());

        payment = paymentRepository.save(payment);

        // Settle the invoice and bills
        invoiceService.markAsPaid(invoice.getId());

        logger.info("Payment SUCCESS for invoice {}: transaction {}",
                invoice.getInvoiceCode(), request.getTransactionCode());

        return payment;
    }

    private PaymentEntity createFailedPayment(InvoiceEntity invoice, PaymentWebhookRequest request,
                                               PaymentFailureReason reason) {
        PaymentEntity payment = new PaymentEntity();
        payment.setInvoice(invoice);
        payment.setTransactionCode(request.getTransactionCode());
        payment.setAmount(request.getAmount());
        payment.setStatus(PaymentStatus.FAILED);
        payment.setFailureReason(reason);
        payment.setTransactionTime(request.getTransactionTime());

        payment = paymentRepository.save(payment);

        logger.warn("Payment FAILED for invoice {}: reason={}, transaction={}",
                invoice.getInvoiceCode(), reason, request.getTransactionCode());

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
}
