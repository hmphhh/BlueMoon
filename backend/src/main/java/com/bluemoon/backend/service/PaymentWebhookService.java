package com.bluemoon.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.bluemoon.backend.dtos.request.PaymentWebhookRequest;
import com.bluemoon.backend.entity.PaymentEntity;

/**
 * Integration layer between the payment provider and the application.
 * Contains no business logic — only receives, parses, and delegates.
 */
@Service
public class PaymentWebhookService {

    private static final Logger logger = LoggerFactory.getLogger(PaymentWebhookService.class);

    @Autowired
    private PaymentService paymentService;

    /**
     * Handle an incoming webhook request from the payment provider.
     */
    public void handleWebhook(PaymentWebhookRequest request) {
        logger.info("Received payment webhook: transactionCode={}, referenceCode={}, amount={}",
                request.getTransactionCode(), request.getReferenceCode(), request.getAmount());

        try {
            PaymentEntity payment = paymentService.processPayment(request);
            logger.info("Webhook processed: paymentId={}, status={}",
                    payment.getId(), payment.getStatus());
        } catch (Exception e) {
            logger.error("Webhook processing failed for transaction {}: {}",
                    request.getTransactionCode(), e.getMessage());
            throw e;
        }
    }
}
