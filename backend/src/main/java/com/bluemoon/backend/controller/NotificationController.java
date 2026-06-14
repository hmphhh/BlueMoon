package com.bluemoon.backend.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import com.bluemoon.backend.dtos.response.NotificationResponse;
import com.bluemoon.backend.service.NotificationService;

/**
 * User-facing notification endpoints.
 */
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    /**
     * GET /api/notifications/me/unread-count
     * Returns the unread notification count for the authenticated user.
     */
    @GetMapping("/me/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        long count = notificationService.getUnreadCount(username);
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }

    /**
     * GET /api/notifications/me
     * Returns paginated notifications for the authenticated user.
     */
    @GetMapping("/me")
    public ResponseEntity<Page<NotificationResponse>> getMyNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Boolean read) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(notificationService.getMyNotifications(username, category, read, pageable));
    }

    /**
     * GET /api/notifications/{id}
     * Returns a specific notification. User sees own; admin sees all.
     */
    @GetMapping("/{id}")
    public ResponseEntity<NotificationResponse> getNotificationById(@PathVariable Long id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        return ResponseEntity.ok(notificationService.getNotificationById(id, username, isAdmin));
    }

    /**
     * PATCH /api/notifications/{id}/read
     * Marks a single notification as read.
     */
    @PatchMapping("/{id}/read")
    public ResponseEntity<NotificationResponse> markAsRead(@PathVariable Long id) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(notificationService.markAsRead(id, username));
    }

    /**
     * PATCH /api/notifications/me/read-all
     * Marks all unread notifications as read for the authenticated user.
     */
    @PatchMapping("/me/read-all")
    public ResponseEntity<Map<String, Integer>> markAllAsRead() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        int count = notificationService.markAllAsRead(username);
        return ResponseEntity.ok(Map.of("updatedCount", count));
    }

    /**
     * DELETE /api/notifications/{id}
     * Soft-deletes a notification for the authenticated user.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMyNotification(@PathVariable Long id) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        notificationService.deleteMyNotification(id, username);
        return ResponseEntity.noContent().build();
    }

    /**
     * DELETE /api/notifications/me
     * Soft-deletes all notifications for the authenticated user.
     */
    @DeleteMapping("/me")
    public ResponseEntity<Map<String, Integer>> deleteAllMyNotifications() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        int count = notificationService.deleteAllMyNotifications(username);
        return ResponseEntity.ok(Map.of("deletedCount", count));
    }
}
