package com.bluemoon.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.bluemoon.backend.dtos.request.PaymentWebhookRequest;
import com.bluemoon.backend.entity.PaymentEntity;

/**
 * Integration layer between SePay and the application.
 * Contains no business logic — only receives, parses, and delegates to PaymentService.
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
        logger.info("Received SePay webhook: id={}, transferType={}, amount={}",
                request.getId(), request.getTransferType(), request.getTransferAmount());

        try {
            PaymentEntity payment = paymentService.processPayment(request);
            
            if (payment != null) {
                logger.info("Webhook processed: paymentId={}, status={}, transactionCode={}",
                        payment.getId(), payment.getStatus(), payment.getTransactionCode());
            } else {
                logger.info("Webhook ignored: outgoing transfer or invalid format (id={})", request.getId());
            }
        } catch (Exception e) {
            logger.error("Webhook processing failed for transaction {}: {}", 
                    request.getId(), e.getMessage(), e);
            throw e;
        }
    }
}
