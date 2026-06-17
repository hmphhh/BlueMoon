package com.bluemoon.backend.controller.communication;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.bluemoon.backend.dtos.request.communication.NotificationTemplateRequest;
import com.bluemoon.backend.dtos.request.communication.SendNotificationRequest;
import com.bluemoon.backend.dtos.response.communication.NotificationResponse;
import com.bluemoon.backend.dtos.response.communication.NotificationTemplateResponse;
import com.bluemoon.backend.service.communication.NotificationService;
import com.bluemoon.backend.service.communication.NotificationTemplateService;

/**
 * Admin-only notification management endpoints.
 */
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminNotificationController {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private NotificationTemplateService notificationTemplateService;

    // ═══════════════════════════════════════════════
    // NOTIFICATION TEMPLATE ENDPOINTS
    // ═══════════════════════════════════════════════

    /**
     * GET /api/admin/notification-templates
     */
    @GetMapping("/notification-templates")
    public ResponseEntity<List<NotificationTemplateResponse>> getAllTemplates() {
        return ResponseEntity.ok(notificationTemplateService.getAllTemplates());
    }

    /**
     * GET /api/admin/notification-templates/{id}
     */
    @GetMapping("/notification-templates/{id}")
    public ResponseEntity<NotificationTemplateResponse> getTemplateById(@PathVariable Long id) {
        return ResponseEntity.ok(notificationTemplateService.getTemplateById(id));
    }

    /**
     * POST /api/admin/notification-templates
     */
    @PostMapping("/notification-templates")
    public ResponseEntity<NotificationTemplateResponse> createTemplate(
            @RequestBody NotificationTemplateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(notificationTemplateService.createTemplate(request));
    }

    /**
     * PUT /api/admin/notification-templates/{id}
     */
    @PutMapping("/notification-templates/{id}")
    public ResponseEntity<NotificationTemplateResponse> updateTemplate(
            @PathVariable Long id,
            @RequestBody NotificationTemplateRequest request) {
        return ResponseEntity.ok(notificationTemplateService.updateTemplate(id, request));
    }

    /**
     * DELETE /api/admin/notification-templates/{id}
     */
    @DeleteMapping("/notification-templates/{id}")
    public ResponseEntity<Map<String, String>> deleteTemplate(@PathVariable Long id) {
        notificationTemplateService.deleteTemplate(id);
        return ResponseEntity.ok(Map.of("message", "Notification template deleted successfully"));
    }

    // ═══════════════════════════════════════════════
    // NOTIFICATION MANAGEMENT ENDPOINTS
    // ═══════════════════════════════════════════════

    /**
     * GET /api/admin/notifications
     * List all notifications with optional filters.
     */
    @GetMapping("/notifications")
    public ResponseEntity<Page<NotificationResponse>> getAdminNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Boolean read,
            @RequestParam(required = false) Boolean deleted,
            @RequestParam(required = false) Long userId) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(notificationService.getAdminNotifications(category, read, deleted, userId, pageable));
    }

    /**
     * POST /api/admin/notifications
     * Send notifications from a template to selected users.
     */
    @PostMapping("/notifications")
    public ResponseEntity<Map<String, Integer>> sendNotifications(
            @RequestBody SendNotificationRequest request) {
        String adminUsername = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication().getName();
        int count = notificationService.sendNotifications(request, adminUsername);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("sentCount", count));
    }

    /**
     * DELETE /api/admin/notifications/{id}
     * Soft-delete a specific notification.
     */
    @DeleteMapping("/notifications/{id}")
    public ResponseEntity<Void> adminDeleteNotification(@PathVariable Long id) {
        notificationService.adminDeleteNotification(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * DELETE /api/admin/notifications?ids=1,2,3
     * Bulk soft-delete notifications.
     */
    @DeleteMapping("/notifications")
    public ResponseEntity<Map<String, Integer>> adminBulkDeleteNotifications(
            @RequestParam List<Long> ids) {
        int count = notificationService.adminBulkDeleteNotifications(ids);
        return ResponseEntity.ok(Map.of("deletedCount", count));
    }
}
