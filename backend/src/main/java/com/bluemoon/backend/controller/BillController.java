package com.bluemoon.backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import com.bluemoon.backend.dtos.request.CreateBillRequest;
import com.bluemoon.backend.dtos.request.GenerateBillsRequest;
import com.bluemoon.backend.dtos.request.UpdateBillRequest;
import com.bluemoon.backend.dtos.response.BillDetailsResponse;
import com.bluemoon.backend.dtos.response.BillSummaryResponse;
import com.bluemoon.backend.enums.BillStatus;
import com.bluemoon.backend.service.BillService;

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
     * PATCH /api/bills/{billId}/paid — Mark bill as paid (admin only).
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{billId}/paid")
    public ResponseEntity<BillDetailsResponse> markAsPaid(@PathVariable Long billId) {
        return ResponseEntity.ok(billService.markAsPaid(billId));
    }

    /**
     * PATCH /api/bills/{billId}/cancel — Cancel bill (admin only).
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{billId}/cancel")
    public ResponseEntity<BillDetailsResponse> cancelBill(@PathVariable Long billId) {
        return ResponseEntity.ok(billService.cancelBill(billId));
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
