package com.bluemoon.backend.controller.billing;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import com.bluemoon.backend.dtos.request.contribution.CreateContributionInvoiceRequest;
import com.bluemoon.backend.dtos.request.billing.CreateInvoiceRequest;
import com.bluemoon.backend.dtos.response.billing.InvoiceDetailsResponse;
import com.bluemoon.backend.dtos.response.billing.InvoiceResponse;
import com.bluemoon.backend.dtos.response.billing.InvoiceSummaryResponse;
import com.bluemoon.backend.dtos.response.billing.PaymentSummaryResponse;
import com.bluemoon.backend.entity.auth.UserEntity;
import com.bluemoon.backend.enums.billing.InvoiceStatus;
import com.bluemoon.backend.exceptions.InvalidOperationException;
import com.bluemoon.backend.exceptions.ResourceNotFoundException;
import com.bluemoon.backend.repository.auth.UserRepository;
import com.bluemoon.backend.service.billing.InvoiceService;
import com.bluemoon.backend.service.billing.PaymentService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/invoices")
public class InvoiceController {

    @Autowired
    private InvoiceService invoiceService;

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private UserRepository userRepository;

    /**
     * POST /api/invoices/bill — Create a new bill invoice.
     * Authenticated User.
     */
    @PostMapping("/bill")
    public ResponseEntity<InvoiceResponse> createBillInvoice(@Valid @RequestBody CreateInvoiceRequest request) {
        Long userId = getCurrentUserId();
        InvoiceResponse response = invoiceService.createInvoice(request.getBillIds(), userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * POST /api/invoices/contribution — Create a new contribution invoice.
     * Authenticated User (resident only).
     */
    @PostMapping("/contribution")
    public ResponseEntity<InvoiceResponse> createContributionInvoice(
            @Valid @RequestBody CreateContributionInvoiceRequest request) {
        Long userId = getCurrentUserId();
        InvoiceResponse response = invoiceService.createContributionInvoice(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * GET /api/invoices/me — Get invoices created by the authenticated user.
     * Only shows PAID and PENDING invoices. createdBy field is not included.
     */
    @GetMapping("/me")
    public ResponseEntity<Page<InvoiceSummaryResponse>> getMyInvoices(
            @RequestParam(required = false) InvoiceStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        int cappedSize = Math.min(size, 50);
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(invoiceService.getMyInvoices(
                userId, status,
                PageRequest.of(page, cappedSize, Sort.by(Sort.Direction.DESC, "createdAt"))));
    }

    /**
     * GET /api/invoices/me/stats — Count of invoices by status for current user.
     */
    @GetMapping("/me/stats")
    public ResponseEntity<Map<String, Long>> getMyInvoiceStats() {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(invoiceService.getMyInvoiceStats(userId));
    }

    /**
     * GET /api/invoices/{invoiceId} — Get invoice details.
     * Invoice Owner OR Admin.
     */
    @GetMapping("/{invoiceId}")
    public ResponseEntity<InvoiceDetailsResponse> getInvoiceDetails(@PathVariable Long invoiceId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        InvoiceDetailsResponse response = invoiceService.getInvoiceDetails(invoiceId);

        // If not admin, check ownership
        if (!isAdmin) {
            Long userId = getCurrentUserId();
            if (!response.getCreatedBy().getId().equals(userId)) {
                throw new ResourceNotFoundException("Invoice not found with id: " + invoiceId);
            }
        }

        return ResponseEntity.ok(response);
    }

    /**
     * DELETE /api/invoices/{invoiceId} — Cancel an invoice (change status to CANCELLED).
     * Invoice Owner Only.
     */
    @DeleteMapping("/{invoiceId}")
    public ResponseEntity<Map<String, String>> cancelInvoice(@PathVariable Long invoiceId) {
        Long userId = getCurrentUserId();
        invoiceService.cancelInvoice(invoiceId, userId);
        return ResponseEntity.ok(Map.of("message", "Invoice cancelled successfully."));
    }

    /**
     * GET /api/invoices — Get all invoices (admin only).
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<Page<InvoiceSummaryResponse>> getAllInvoices(
            @RequestParam(required = false) InvoiceStatus status,
            @RequestParam(required = false) Long createdBy,
            @RequestParam(required = false) String invoiceCode,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        int cappedSize = Math.min(size, 50);
        return ResponseEntity.ok(invoiceService.getAllInvoices(
                status, createdBy, invoiceCode,
                PageRequest.of(page, cappedSize, Sort.by(Sort.Direction.DESC, "createdAt"))));
    }

    /**
     * GET /api/invoices/stats — Aggregate invoice counts by status (admin only).
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getInvoiceStats() {
        return ResponseEntity.ok(invoiceService.getInvoiceStats());
    }

    /**
     * GET /api/invoices/{invoiceId}/payments — Get all payments for an invoice (admin only).
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{invoiceId}/payments")
    public ResponseEntity<List<PaymentSummaryResponse>> getInvoicePayments(@PathVariable Long invoiceId) {
        return ResponseEntity.ok(paymentService.getPaymentsByInvoiceId(invoiceId));
    }

    // ============================================================
    // Private Helpers
    // ============================================================

    private Long getCurrentUserId() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        UserEntity user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        return user.getId();
    }
}
