package com.bluemoon.backend.controller.communication;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import com.bluemoon.backend.dtos.request.communication.ReportRequest;
import com.bluemoon.backend.dtos.request.communication.ReviewReportRequest;
import com.bluemoon.backend.dtos.response.communication.AdminReportSummaryResponse;
import com.bluemoon.backend.dtos.response.communication.ReportDetailsResponse;
import com.bluemoon.backend.dtos.response.communication.ReportSummaryResponse;
import com.bluemoon.backend.enums.communication.ReportStatus;
import com.bluemoon.backend.enums.auth.UserRole;
import com.bluemoon.backend.service.communication.ReportService;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    @Autowired
    private ReportService reportService;

    // ═══════════════════════════════════════════════
    // USER ENDPOINTS
    // ═══════════════════════════════════════════════

    /**
     * POST /api/reports — Create a new report (USER only).
     */
    @PreAuthorize("hasRole('USER')")
    @PostMapping
    public ResponseEntity<ReportSummaryResponse> createReport(@RequestBody ReportRequest request) {
        String username = getCurrentUsername();
        ReportSummaryResponse response = reportService.createReport(username, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * GET /api/reports/me — Get current user's reports with optional status filter.
     */
    @PreAuthorize("hasRole('USER')")
    @GetMapping("/me")
    public ResponseEntity<Page<ReportSummaryResponse>> getMyReports(
            @RequestParam(required = false) ReportStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        int cappedSize = Math.min(size, 50);
        String username = getCurrentUsername();
        Page<ReportSummaryResponse> reports = reportService.getMyReports(
                username, status,
                PageRequest.of(page, cappedSize, Sort.by(Sort.Direction.DESC, "createdAt")));
        return ResponseEntity.ok(reports);
    }

    /**
     * GET /api/reports/{reportId} — Get report details (USER own or ADMIN any).
     */
    @GetMapping("/{reportId}")
    public ResponseEntity<ReportDetailsResponse> getReportDetails(@PathVariable Long reportId) {
        String username = getCurrentUsername();
        UserRole role = getCurrentUserRole();
        ReportDetailsResponse response = reportService.getReportDetails(reportId, username, role);
        return ResponseEntity.ok(response);
    }

    /**
     * PATCH /api/reports/{reportId} — Update a report (USER, own, PENDING only).
     */
    @PreAuthorize("hasRole('USER')")
    @PatchMapping("/{reportId}")
    public ResponseEntity<ReportDetailsResponse> updateReport(
            @PathVariable Long reportId,
            @RequestBody ReportRequest request) {
        String username = getCurrentUsername();
        ReportDetailsResponse response = reportService.updateReport(reportId, username, request);
        return ResponseEntity.ok(response);
    }

    /**
     * DELETE /api/reports/{reportId} — Delete a report (USER, own, PENDING only).
     */
    @PreAuthorize("hasRole('USER')")
    @DeleteMapping("/{reportId}")
    public ResponseEntity<Void> deleteReport(@PathVariable Long reportId) {
        String username = getCurrentUsername();
        reportService.deleteReport(reportId, username);
        return ResponseEntity.noContent().build();
    }

    // ═══════════════════════════════════════════════
    // ADMIN ENDPOINTS
    // ═══════════════════════════════════════════════

    /**
     * GET /api/reports — Get all reports with optional filters (ADMIN only).
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<Page<AdminReportSummaryResponse>> getAllReports(
            @RequestParam(required = false) ReportStatus status,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Long apartmentId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<AdminReportSummaryResponse> reports = reportService.getAllReports(status, userId, apartmentId, pageable);
        return ResponseEntity.ok(reports);
    }

    /**
     * PATCH /api/reports/{reportId}/review — Review a report (ADMIN only).
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{reportId}/review")
    public ResponseEntity<ReportDetailsResponse> reviewReport(
            @PathVariable Long reportId,
            @RequestBody ReviewReportRequest request) {
        String username = getCurrentUsername();
        ReportDetailsResponse response = reportService.reviewReport(reportId, username, request);
        return ResponseEntity.ok(response);
    }

    // ═══════════════════════════════════════════════
    // PRIVATE HELPERS
    // ═══════════════════════════════════════════════

    private String getCurrentUsername() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    private UserRole getCurrentUserRole() {
        var authorities = SecurityContextHolder.getContext().getAuthentication().getAuthorities();
        if (authorities.stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return UserRole.ADMIN;
        }
        return UserRole.USER;
    }
}
