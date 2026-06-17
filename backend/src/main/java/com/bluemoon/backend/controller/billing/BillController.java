package com.bluemoon.backend.controller.billing;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import com.bluemoon.backend.dtos.request.billing.BatchBillRequest;
import com.bluemoon.backend.dtos.request.billing.CreateBillRequest;
import com.bluemoon.backend.dtos.request.billing.GenerateBillsRequest;
import com.bluemoon.backend.dtos.request.billing.UpdateBillRequest;
import com.bluemoon.backend.dtos.response.billing.BillDetailsResponse;
import com.bluemoon.backend.dtos.response.billing.BillSummaryResponse;
import com.bluemoon.backend.enums.billing.BillStatus;
import com.bluemoon.backend.service.billing.BillService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/bills")
public class BillController {

    @Autowired
    private BillService billService;

    /**
     * GET /api/bills — List all bills with optional filters (admin only).
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<List<BillSummaryResponse>> getAllBills(
            @RequestParam(required = false) Long apartmentId,
            @RequestParam(required = false) BillStatus status,
            @RequestParam(required = false) String search
    ) {
        return ResponseEntity.ok(billService.getAllBills(apartmentId, status, search));
    }

    /**
     * GET /api/bills/me — List bills for current user's apartment (excludes CANCELLED).
     */
    @GetMapping("/me")
    public ResponseEntity<List<BillSummaryResponse>> getMyBills(
            @RequestParam(required = false) BillStatus status
    ) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(billService.getMyBills(username, status));
    }

    /**
     * GET /api/bills/{billId} — Bill details.
     * ADMIN sees any bill. USER sees only bills belonging to their apartment (non-cancelled).
     */
    @GetMapping("/{billId}")
    public ResponseEntity<BillDetailsResponse> getBillById(@PathVariable Long billId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        return ResponseEntity.ok(billService.getBillById(billId, username, isAdmin));
    }

    /**
     * POST /api/bills — Create a custom bill (admin only).
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<BillSummaryResponse> createBill(@RequestBody CreateBillRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(billService.createBill(request));
    }

    /**
     * POST /api/bills/generate — Generate bills from template (admin only).
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/generate")
    public ResponseEntity<Map<String, Integer>> generateBills(@RequestBody GenerateBillsRequest request) {
        int count = billService.generateBills(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("generatedCount", count));
    }

    /**
     * PATCH /api/bills/{billId} — Update bill (admin only, UNPAID/OVERDUE only).
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{billId}")
    public ResponseEntity<BillSummaryResponse> updateBill(@PathVariable Long billId,
                                                           @RequestBody UpdateBillRequest request) {
        return ResponseEntity.ok(billService.updateBill(billId, request));
    }

    /**
     * PATCH /api/bills/paid — Batch mark bills as paid (admin only).
     * Creates an Invoice + Payment record for the selected bills.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/paid")
    public ResponseEntity<Map<String, String>> batchMarkAsPaid(@Valid @RequestBody BatchBillRequest request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        billService.batchMarkAsPaid(request.getBillIds(), username);
        return ResponseEntity.ok(Map.of("message", "Bills marked as paid successfully."));
    }

    /**
     * PATCH /api/bills/cancel — Batch cancel bills (admin only).
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/cancel")
    public ResponseEntity<Map<String, String>> batchCancelBills(@Valid @RequestBody BatchBillRequest request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        billService.batchCancelBills(request.getBillIds(), username);
        return ResponseEntity.ok(Map.of("message", "Bills cancelled successfully."));
    }

    /**
     * DELETE /api/bills/{billId} — Delete bill (admin only, CANCELLED only).
     */
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{billId}")
    public ResponseEntity<Map<String, String>> deleteBill(@PathVariable Long billId) {
        billService.deleteBill(billId);
        return ResponseEntity.ok(Map.of("message", "Bill deleted successfully"));
    }
}

