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
     * POST /api/payment-webhooks — Receive payment notification.
     * Authenticated via API key in header.
     */
    @PostMapping
    public ResponseEntity<Map<String, String>> receiveWebhook(
            @Valid @RequestBody PaymentWebhookRequest request,
            HttpServletRequest httpRequest) {

        // Validate API key
        String apiKey = httpRequest.getHeader("X-API-Key");
        if (apiKey == null || !apiKey.equals(sepayConfig.getWebhookApiKey())) {
            return ResponseEntity.status(401)
                    .body(Map.of("error", "Unauthorized: Invalid or missing API key."));
        }

        // Alternative: HMAC-SHA256 signature verification
        // String signature = httpRequest.getHeader("X-Signature");
        // if (!verifyHmacSignature(request, signature)) {
        //     return ResponseEntity.status(401)
        //             .body(Map.of("error", "Unauthorized: Invalid signature."));
        // }

        paymentWebhookService.handleWebhook(request);

        return ResponseEntity.ok(Map.of("message", "Webhook processed successfully."));
    }

    // /**
    //  * Verify HMAC-SHA256 signature for webhook requests.
    //  * Alternative to API key authentication.
    //  */
    // private boolean verifyHmacSignature(PaymentWebhookRequest request, String signature) {
    //     if (signature == null || signature.isBlank()) {
    //         return false;
    //     }
    //     try {
    //         String payload = request.getTransactionCode() + request.getReferenceCode()
    //                 + request.getAmount().toPlainString() + request.getTransactionTime().toString();
    //         javax.crypto.Mac mac = javax.crypto.Mac.getInstance("HmacSHA256");
    //         mac.init(new javax.crypto.spec.SecretKeySpec(
    //                 sepayConfig.getWebhookHmacSecret().getBytes(java.nio.charset.StandardCharsets.UTF_8),
    //                 "HmacSHA256"));
    //         byte[] hash = mac.doFinal(payload.getBytes(java.nio.charset.StandardCharsets.UTF_8));
    //         String computed = java.util.Base64.getEncoder().encodeToString(hash);
    //         return computed.equals(signature);
    //     } catch (Exception e) {
    //         return false;
    //     }
    // }
}
