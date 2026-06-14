package com.bluemoon.backend.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.bluemoon.backend.dtos.request.ReportRequest;
import com.bluemoon.backend.dtos.request.ReviewReportRequest;
import com.bluemoon.backend.dtos.response.AdminReportSummaryResponse;
import com.bluemoon.backend.dtos.response.ReportDetailsResponse;
import com.bluemoon.backend.dtos.response.ReportSummaryResponse;
import com.bluemoon.backend.dtos.response.UserReferenceResponse;
import com.bluemoon.backend.entity.ReportEntity;
import com.bluemoon.backend.entity.UserEntity;
import com.bluemoon.backend.enums.ReportStatus;
import com.bluemoon.backend.enums.UserRole;
import com.bluemoon.backend.exceptions.InvalidOperationException;
import com.bluemoon.backend.exceptions.ResourceNotFoundException;
import com.bluemoon.backend.repository.ReportRepository;
import com.bluemoon.backend.repository.UserRepository;
import com.bluemoon.backend.enums.NotificationPriority;
import com.bluemoon.backend.enums.NotificationReferenceType;
import com.bluemoon.backend.enums.NotificationType;

@Service
public class ReportService {

    @Autowired
    private ReportRepository reportRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationService notificationService;

    // ═══════════════════════════════════════════════
    // USER OPERATIONS
    // ═══════════════════════════════════════════════

    /**
     * Create a new report. Only USER role allowed.
     */
    @Transactional
    public ReportSummaryResponse createReport(String username, ReportRequest request) {
        UserEntity user = getUserByUsername(username);

        if (user.getRole() != UserRole.USER) {
            throw new InvalidOperationException("Only users with role USER can create reports");
        }

        ReportEntity report = new ReportEntity();
        report.setTitle(request.getTitle());
        report.setContent(request.getContent());
        report.setStatus(ReportStatus.PENDING);
        report.setCreatedBy(user);

        report = reportRepository.save(report);

        // Section 2.2: Notify all admins about the new report
        try {
            notificationService.notifyAllAdmins(
                    "New Report Submitted",
                    "User \"" + user.getFullName() + "\" submitted a new report: \"" + report.getTitle() + "\".",
                    NotificationType.REPORT_CREATED,
                    NotificationReferenceType.REPORT,
                    report.getId(),
                    NotificationPriority.NORMAL
            );
        } catch (Exception e) {
            // Don't fail report creation if notification fails
        }

        return new ReportSummaryResponse(
            report.getId(),
            report.getTitle(),
            report.getStatus(),
            report.getCreatedAt()
        );
    }

    /**
     * Get current user's reports, optionally filtered by status.
     */
    public List<ReportSummaryResponse> getMyReports(String username, ReportStatus status) {
        UserEntity user = getUserByUsername(username);

        List<ReportEntity> reports;
        if (status != null) {
            reports = reportRepository.findByCreatedByIdAndStatusOrderByCreatedAtDesc(user.getId(), status);
        } else {
            reports = reportRepository.findByCreatedByIdOrderByCreatedAtDesc(user.getId());
        }

        return reports.stream()
            .map(r -> new ReportSummaryResponse(r.getId(), r.getTitle(), r.getStatus(), r.getCreatedAt()))
            .collect(Collectors.toList());
    }

    /**
     * Get report details. USER can only see own reports; ADMIN can see any.
     */
    public ReportDetailsResponse getReportDetails(Long reportId, String username, UserRole role) {
        ReportEntity report = reportRepository.findById(reportId)
            .orElseThrow(() -> new ResourceNotFoundException("Report not found with id: " + reportId));

        UserEntity currentUser = getUserByUsername(username);

        // Ownership check for USER role
        if (role == UserRole.USER && !report.getCreatedBy().getId().equals(currentUser.getId())) {
            throw new InvalidOperationException("You can only view your own reports");
        }

        ReportDetailsResponse response = toReportDetailsResponse(report);

        // For USER role: hide reviewer identity and creator info (they know who they are)
        if (role == UserRole.USER) {
            response.setReviewedBy(null);
            response.setCreatedBy(null);
            response.setCreatedByApartmentNumber(null);
        }

        return response;
    }

    /**
     * Update a report. Must be creator, and report must be PENDING.
     */
    @Transactional
    public ReportDetailsResponse updateReport(Long reportId, String username, ReportRequest request) {
        ReportEntity report = reportRepository.findById(reportId)
            .orElseThrow(() -> new ResourceNotFoundException("Report not found with id: " + reportId));

        UserEntity user = getUserByUsername(username);

        if (!report.getCreatedBy().getId().equals(user.getId())) {
            throw new InvalidOperationException("You can only update your own reports");
        }

        if (report.getStatus() != ReportStatus.PENDING) {
            throw new InvalidOperationException("Only PENDING reports can be updated");
        }

        if (request.getTitle() != null) {
            report.setTitle(request.getTitle());
        }
        if (request.getContent() != null) {
            report.setContent(request.getContent());
        }

        report = reportRepository.save(report);

        // Section 2.2: Notify all admins about the report update
        try {
            notificationService.notifyAllAdmins(
                    "Report Updated",
                    "User \"" + user.getFullName() + "\" updated report: \"" + report.getTitle() + "\".",
                    NotificationType.REPORT_UPDATED,
                    NotificationReferenceType.REPORT,
                    report.getId(),
                    NotificationPriority.NORMAL
            );
        } catch (Exception e) {
            // Don't fail report update if notification fails
        }

        return toReportDetailsResponse(report);
    }

    /**
     * Delete a report. Must be creator, and report must be PENDING.
     */
    @Transactional
    public void deleteReport(Long reportId, String username) {
        ReportEntity report = reportRepository.findById(reportId)
            .orElseThrow(() -> new ResourceNotFoundException("Report not found with id: " + reportId));

        UserEntity user = getUserByUsername(username);

        if (!report.getCreatedBy().getId().equals(user.getId())) {
            throw new InvalidOperationException("You can only delete your own reports");
        }

        if (report.getStatus() != ReportStatus.PENDING) {
            throw new InvalidOperationException("Only PENDING reports can be deleted");
        }

        reportRepository.delete(report);
    }

    // ═══════════════════════════════════════════════
    // ADMIN OPERATIONS
    // ═══════════════════════════════════════════════

    /**
     * Get all reports with optional filters. Admin only.
     */
    public Page<AdminReportSummaryResponse> getAllReports(
            ReportStatus status, Long userId, Long apartmentId, Pageable pageable) {
        return reportRepository.findAllReports(status, userId, apartmentId, pageable);
    }

    /**
     * Review a report (approve/reject). Admin only.
     * Sets reviewedBy, reviewedAt, and status. Cannot re-review.
     */
    @Transactional
    public ReportDetailsResponse reviewReport(Long reportId, String adminUsername, ReviewReportRequest request) {
        ReportEntity report = reportRepository.findById(reportId)
            .orElseThrow(() -> new ResourceNotFoundException("Report not found with id: " + reportId));

        if (report.getStatus() != ReportStatus.PENDING) {
            throw new InvalidOperationException("This report has already been reviewed");
        }

        if (request.getStatus() == null || request.getStatus() == ReportStatus.PENDING) {
            throw new InvalidOperationException("Review status must be APPROVED or REJECTED");
        }

        UserEntity admin = getUserByUsername(adminUsername);

        report.setStatus(request.getStatus());
        report.setReviewNote(request.getReviewNote());
        report.setReviewedBy(admin);
        report.setReviewedAt(LocalDateTime.now());

        report = reportRepository.save(report);

        // Section 1.4: Send REPORT_APPROVED or REPORT_REJECTED notification to the report creator
        try {
            boolean isApproved = request.getStatus() == ReportStatus.APPROVED;
            String statusLabel = isApproved ? "approved" : "rejected";
            NotificationType notifType = isApproved
                    ? NotificationType.REPORT_APPROVED
                    : NotificationType.REPORT_REJECTED;
            notificationService.createAutoNotification(
                    report.getCreatedBy(),
                    "Report " + (isApproved ? "Approved" : "Rejected"),
                    "Your report \"" + report.getTitle() + "\" has been " + statusLabel + ".",
                    notifType,
                    NotificationReferenceType.REPORT,
                    report.getId(),
                    NotificationPriority.NORMAL
            );
        } catch (Exception e) {
            // Don't fail review if notification fails
        }

        return toReportDetailsResponse(report);
    }

    // ═══════════════════════════════════════════════
    // PRIVATE HELPERS
    // ═══════════════════════════════════════════════

    private UserEntity getUserByUsername(String username) {
        return userRepository.findByUsername(username)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
    }

    private ReportDetailsResponse toReportDetailsResponse(ReportEntity report) {
        ReportDetailsResponse response = new ReportDetailsResponse();
        response.setId(report.getId());
        response.setTitle(report.getTitle());
        response.setContent(report.getContent());
        response.setStatus(report.getStatus());
        response.setReviewNote(report.getReviewNote());
        response.setCreatedAt(report.getCreatedAt());
        response.setReviewedAt(report.getReviewedAt());

        if (report.getCreatedBy() != null) {
            response.setCreatedBy(new UserReferenceResponse(
                report.getCreatedBy().getId(),
                report.getCreatedBy().getFullName()
            ));
            // Include apartment number for admin detail view
            if (report.getCreatedBy().getApartment() != null) {
                response.setCreatedByApartmentNumber(
                    report.getCreatedBy().getApartment().getApartmentNumber()
                );
            }
        }

        if (report.getReviewedBy() != null) {
            response.setReviewedBy(new UserReferenceResponse(
                report.getReviewedBy().getId(),
                report.getReviewedBy().getFullName()
            ));
        }

        return response;
    }
}
