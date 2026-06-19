package com.bluemoon.backend.controller.billing;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
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
    public ResponseEntity<Page<PaymentSummaryResponse>> getAllPayments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        int cappedSize = Math.min(size, 50);
        return ResponseEntity.ok(paymentService.getAllPayments(
                PageRequest.of(page, cappedSize, Sort.by(Sort.Direction.DESC, "createdAt"))));
    }

    /**
     * GET /api/payments/stats — Aggregate payment counts by status (admin only).
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getPaymentStats() {
        return ResponseEntity.ok(paymentService.getPaymentStats());
    }
}
