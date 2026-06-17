package com.bluemoon.backend.controller.billing;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.bluemoon.backend.dtos.response.billing.PaymentDetailsResponse;
import com.bluemoon.backend.dtos.response.billing.PaymentSummaryResponse;
import com.bluemoon.backend.service.billing.PaymentService;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    /**
     * GET /api/payments/{paymentId} — Get payment details (admin only).
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{paymentId}")
    public ResponseEntity<PaymentDetailsResponse> getPaymentDetails(@PathVariable Long paymentId) {
        return ResponseEntity.ok(paymentService.getPaymentDetails(paymentId));
    }

    /**
     * GET /api/payments — Get all payments (admin only).
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<List<PaymentSummaryResponse>> getAllPayments() {
        return ResponseEntity.ok(paymentService.getAllPayments());
    }
}
