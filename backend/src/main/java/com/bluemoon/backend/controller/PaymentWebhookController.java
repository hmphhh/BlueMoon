package com.bluemoon.backend.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.bluemoon.backend.config.SepayConfig;
import com.bluemoon.backend.dtos.request.PaymentWebhookRequest;
import com.bluemoon.backend.service.PaymentWebhookService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

/**
 * Webhook controller for receiving payment notifications from the payment provider.
 * This endpoint is NOT authenticated via JWT — it uses API key authentication instead.
 */
@RestController
@RequestMapping("/api/payment-webhooks")
public class PaymentWebhookController {

    @Autowired
    private PaymentWebhookService paymentWebhookService;

    @Autowired
    private SepayConfig sepayConfig;

    /**
     * POST /api/payment-webhooks — Receive payment notification from SePay.
     * Authenticated via Authorization header with "Apikey " prefix.
     */
    @PostMapping
    public ResponseEntity<Map<String, String>> receiveWebhook(
            @Valid @RequestBody PaymentWebhookRequest request,
            HttpServletRequest httpRequest) {

        // Validate Authorization header with "Apikey " prefix
        String authHeader = httpRequest.getHeader("Authorization");
        if (!isValidAuthorization(authHeader)) {
            return ResponseEntity.status(401)
                    .body(Map.of("error", "Unauthorized: Invalid or missing Authorization header."));
        }

        paymentWebhookService.handleWebhook(request);

        return ResponseEntity.ok(Map.of("message", "Webhook processed successfully."));
    }

    /**
     * Validate Authorization header format and secret.
     * Expected format: Authorization: Apikey <SECRET_KEY>
     */
    private boolean isValidAuthorization(String authHeader) {
        if (authHeader == null || authHeader.isBlank()) {
            return false;
        }

        final String APIKEY_PREFIX = "Apikey ";
        if (!authHeader.startsWith(APIKEY_PREFIX)) {
            return false;
        }

        String secret = authHeader.substring(APIKEY_PREFIX.length());
        return secret.equals(sepayConfig.getWebhookApiKey());
    }
}
