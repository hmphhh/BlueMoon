package com.bluemoon.backend.service;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.bluemoon.backend.dtos.request.SendNotificationRequest;
import com.bluemoon.backend.dtos.response.NotificationResponse;
import com.bluemoon.backend.dtos.response.UserReferenceResponse;
import com.bluemoon.backend.entity.NotificationEntity;
import com.bluemoon.backend.entity.NotificationTemplateEntity;
import com.bluemoon.backend.entity.UserEntity;
import com.bluemoon.backend.enums.NotificationPriority;
import com.bluemoon.backend.enums.NotificationReferenceType;
import com.bluemoon.backend.enums.NotificationType;
import com.bluemoon.backend.enums.UserRole;
import com.bluemoon.backend.exceptions.InvalidOperationException;
import com.bluemoon.backend.exceptions.ResourceNotFoundException;
import com.bluemoon.backend.repository.NotificationRepository;
import com.bluemoon.backend.repository.UserRepository;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private NotificationTemplateService notificationTemplateService;

    @Autowired
    private UserRepository userRepository;

    // ═══════════════════════════════════════════════
    // USER OPERATIONS
    // ═══════════════════════════════════════════════

    /**
     * Get unread notification count for the current user.
     */
    public long getUnreadCount(String username) {
        UserEntity user = getUserByUsername(username);
        return notificationRepository.countUnreadByUserId(user.getId());
    }

    /**
     * Get paginated notifications for the current user.
     * Accepts a simplified category string (e.g. "BILL", "PAYMENT") instead of an exact enum.
     */
    public Page<NotificationResponse> getMyNotifications(
            String username, String category, Boolean read, Pageable pageable) {
        UserEntity user = getUserByUsername(username);
        List<NotificationType> types = mapCategoryToTypes(category);
        if (types == null) {
            return notificationRepository.findUserNotifications(user.getId(), read, pageable)
                    .map(this::toUserResponse);
        } else {
            return notificationRepository.findUserNotificationsByTypes(user.getId(), types, read, pageable)
                    .map(this::toUserResponse);
        }
    }

    /**
     * Get a single notification detail. User can only see their own.
     */
    public NotificationResponse getNotificationById(Long id, String username, boolean isAdmin) {
        NotificationEntity notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + id));

        UserEntity currentUser = getUserByUsername(username);

        if (!isAdmin) {
            if (!notification.getUser().getId().equals(currentUser.getId())) {
                throw new InvalidOperationException("You can only view your own notifications");
            }
            // Don't show deleted notifications to normal users
            if (notification.isDeletedByUser() || notification.isDeletedByAdmin()) {
                throw new ResourceNotFoundException("Notification not found with id: " + id);
            }
            return toUserResponse(notification);
        }

        return toAdminResponse(notification);
    }

    /**
     * Mark a single notification as read. User can only mark their own.
     */
    @Transactional
    public NotificationResponse markAsRead(Long id, String username) {
        NotificationEntity notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + id));

        UserEntity user = getUserByUsername(username);
        if (!notification.getUser().getId().equals(user.getId())) {
            throw new InvalidOperationException("You can only mark your own notifications as read");
        }

        if (!notification.isRead()) {
            notification.setRead(true);
            notification.setReadAt(LocalDateTime.now());
            notification = notificationRepository.save(notification);
        }

        return toUserResponse(notification);
    }

    /**
     * Mark all unread notifications as read for the current user.
     */
    @Transactional
    public int markAllAsRead(String username) {
        UserEntity user = getUserByUsername(username);
        return notificationRepository.markAllAsReadByUserId(user.getId());
    }

    /**
     * Soft-delete a single notification for the current user.
     */
    @Transactional
    public void deleteMyNotification(Long id, String username) {
        NotificationEntity notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + id));

        UserEntity user = getUserByUsername(username);
        if (!notification.getUser().getId().equals(user.getId())) {
            throw new InvalidOperationException("You can only delete your own notifications");
        }

        notification.setDeletedByUser(true);
        notification.setUserDeletedAt(LocalDateTime.now());
        notificationRepository.save(notification);
    }

    /**
     * Soft-delete all notifications for the current user.
     */
    @Transactional
    public int deleteAllMyNotifications(String username) {
        UserEntity user = getUserByUsername(username);
        return notificationRepository.softDeleteAllByUserId(user.getId());
    }

    // ═══════════════════════════════════════════════
    // ADMIN OPERATIONS
    // ═══════════════════════════════════════════════

    /**
     * Get all notifications (admin). Supports pagination and filtering.
     * Accepts a simplified category string (e.g. "BILL", "PAYMENT") instead of an exact enum.
     */
    public Page<NotificationResponse> getAdminNotifications(
            String category, Boolean read, Boolean deleted, Long userId, Pageable pageable) {
        List<NotificationType> types = mapCategoryToTypes(category);
        if (types == null) {
            return notificationRepository.findAdminNotifications(read, deleted, userId, pageable)
                    .map(this::toAdminResponse);
        } else {
            return notificationRepository.findAdminNotificationsByTypes(types, read, deleted, userId, pageable)
                    .map(this::toAdminResponse);
        }
    }

    /**
     * Send manual notifications from a template to selected users.
     * If the admin is among the recipients, their notification is auto-marked as read.
     * Supports both ANNOUNCEMENT and URGENT_ANNOUNCEMENT (via isUrgent flag on the request).
     * For urgent announcements, also notifies other admins (admin-to-admin rule, Section 3).
     */
    @Transactional
    public int sendNotifications(SendNotificationRequest request, String adminUsername) {
        NotificationTemplateEntity template = notificationTemplateService
                .getTemplateEntityById(request.getTemplateId());

        UserEntity adminUser = getUserByUsername(adminUsername);

        List<UserEntity> users = userRepository.findAllById(request.getUserIds());
        if (users.isEmpty()) {
            throw new InvalidOperationException("No valid users found for the given IDs");
        }

        boolean isUrgent = request.isUrgent();
        NotificationType type = isUrgent
                ? NotificationType.URGENT_ANNOUNCEMENT
                : NotificationType.ANNOUNCEMENT;
        NotificationPriority priority = isUrgent
                ? NotificationPriority.HIGH
                : NotificationPriority.NORMAL;

        int count = 0;
        for (UserEntity user : users) {
            NotificationEntity notification = new NotificationEntity();
            notification.setUser(user);
            notification.setTitle(template.getTitle());
            notification.setMessage(template.getMessage());
            notification.setType(type);
            notification.setDeletedByUser(false);
            notification.setDeletedByAdmin(false);
            notification.setReferenceType(NotificationReferenceType.NONE);
            notification.setReferenceId(null);
            notification.setPriority(priority);

            // If the recipient is the admin who created the notification, mark as read
            if (user.getId().equals(adminUser.getId())) {
                notification.setRead(true);
                notification.setReadAt(LocalDateTime.now());
            } else {
                notification.setRead(false);
            }

            notificationRepository.save(notification);
            count++;
        }

        // Section 3: For urgent announcements, notify other admins (admin-to-admin)
        if (isUrgent) {
            notifyOtherAdmins(
                    adminUser,
                    "Urgent Announcement Created",
                    "An urgent announcement \"" + template.getTitle() + "\" has been created.",
                    NotificationType.URGENT_ANNOUNCEMENT,
                    NotificationReferenceType.NONE,
                    null,
                    NotificationPriority.HIGH
            );
        }

        return count;
    }

    /**
     * Admin soft-delete a notification.
     */
    @Transactional
    public void adminDeleteNotification(Long id) {
        NotificationEntity notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + id));

        notification.setDeletedByAdmin(true);
        notification.setAdminDeletedAt(LocalDateTime.now());
        notificationRepository.save(notification);
    }

    /**
     * Admin bulk soft-delete notifications.
     */
    @Transactional
    public int adminBulkDeleteNotifications(List<Long> ids) {
        List<NotificationEntity> notifications = notificationRepository.findAllByIdIn(ids);
        int count = 0;
        LocalDateTime now = LocalDateTime.now();
        for (NotificationEntity notification : notifications) {
            if (!notification.isDeletedByAdmin()) {
                notification.setDeletedByAdmin(true);
                notification.setAdminDeletedAt(now);
                notificationRepository.save(notification);
                count++;
            }
        }
        return count;
    }

    // ═══════════════════════════════════════════════
    // AUTOMATIC NOTIFICATION HELPERS
    // ═══════════════════════════════════════════════

    /**
     * Create an automatic notification for a specific user (unread by default).
     * Used by other services (PaymentService, BillService, etc.)
     */
    @Transactional
    public void createAutoNotification(
            UserEntity user,
            String title,
            String message,
            NotificationType type,
            NotificationReferenceType referenceType,
            Long referenceId,
            NotificationPriority priority) {

        NotificationEntity notification = new NotificationEntity();
        notification.setUser(user);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        notification.setRead(false);
        notification.setDeletedByUser(false);
        notification.setDeletedByAdmin(false);
        notification.setReferenceType(referenceType);
        notification.setReferenceId(referenceId);
        notification.setPriority(priority);
        notificationRepository.save(notification);
    }

    /**
     * Create an automatic notification for a specific user, pre-marked as read.
     * Used when an admin performs an action and also receives a notification
     * about their own action (Section 2.4 / Section 3 rules).
     */
    @Transactional
    public void createAutoNotificationPreRead(
            UserEntity user,
            String title,
            String message,
            NotificationType type,
            NotificationReferenceType referenceType,
            Long referenceId,
            NotificationPriority priority) {

        NotificationEntity notification = new NotificationEntity();
        notification.setUser(user);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        notification.setRead(true);
        notification.setReadAt(LocalDateTime.now());
        notification.setDeletedByUser(false);
        notification.setDeletedByAdmin(false);
        notification.setReferenceType(referenceType);
        notification.setReferenceId(referenceId);
        notification.setPriority(priority);
        notificationRepository.save(notification);
    }

    /**
     * Send a notification to all ADMIN users.
     * Used for events that require admin awareness (Section 2):
     *   - User payment successful
     *   - User report created / updated
     *   - System errors
     */
    @Transactional
    public void notifyAllAdmins(
            String title,
            String message,
            NotificationType type,
            NotificationReferenceType referenceType,
            Long referenceId,
            NotificationPriority priority) {

        List<UserEntity> admins = userRepository.findByRole(UserRole.ADMIN);
        for (UserEntity admin : admins) {
            createAutoNotification(admin, title, message, type, referenceType, referenceId, priority);
        }
    }

    /**
     * Send a notification to all ADMIN users except the acting admin.
     * The acting admin receives their notification pre-marked as read.
     * Used for admin-to-admin notifications (Section 3):
     *   - Admin cancels a bill
     *   - Admin marks a payment as paid manually
     *   - Admin creates an urgent announcement
     */
    @Transactional
    public void notifyOtherAdmins(
            UserEntity actingAdmin,
            String title,
            String message,
            NotificationType type,
            NotificationReferenceType referenceType,
            Long referenceId,
            NotificationPriority priority) {

        List<UserEntity> admins = userRepository.findByRole(UserRole.ADMIN);
        for (UserEntity admin : admins) {
            if (admin.getId().equals(actingAdmin.getId())) {
                // Section 3: The admin who performed the action gets their notification marked as read
                createAutoNotificationPreRead(admin, title, message, type, referenceType, referenceId, priority);
            } else {
                createAutoNotification(admin, title, message, type, referenceType, referenceId, priority);
            }
        }
    }

    // ═══════════════════════════════════════════════
    // PRIVATE HELPERS
    // ═══════════════════════════════════════════════

    /**
     * Map a simplified category string to a list of NotificationType values.
     * Returns null if no category is specified (i.e. no filter).
     */
    private static final Map<String, List<NotificationType>> CATEGORY_MAP = Map.of(
        "ANNOUNCEMENT", Arrays.asList(NotificationType.ANNOUNCEMENT, NotificationType.URGENT_ANNOUNCEMENT),
        "BILL",         Arrays.asList(NotificationType.BILL_CREATED, NotificationType.BILL_CANCELLED,
                                      NotificationType.BILL_AMOUNT_UPDATED, NotificationType.BILL_DUE_DATE_UPDATED),
        "INVOICE",      Arrays.asList(NotificationType.INVOICE_EXPIRED),
        "PAYMENT",      Arrays.asList(NotificationType.PAYMENT_SUCCESS, NotificationType.PAYMENT_ACCEPTED),
        "REPORT",       Arrays.asList(NotificationType.REPORT_CREATED, NotificationType.REPORT_UPDATED,
                                      NotificationType.REPORT_APPROVED, NotificationType.REPORT_REJECTED),
        "CONTRIBUTION", Arrays.asList(NotificationType.CAMPAIGN_LAUNCHED, NotificationType.CAMPAIGN_COMPLETED,
                                      NotificationType.CONTRIBUTION_PAID),
        "SYSTEM",       Arrays.asList(NotificationType.SYSTEM_ERROR)
    );

    private List<NotificationType> mapCategoryToTypes(String category) {
        if (category == null || category.isBlank()) {
            return null;
        }
        List<NotificationType> types = CATEGORY_MAP.get(category.toUpperCase());
        if (types == null) {
            throw new InvalidOperationException("Unknown notification category: " + category);
        }
        return types;
    }

    private UserEntity getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
    }

    /**
     * Convert to user-facing response (no admin fields).
     */
    private NotificationResponse toUserResponse(NotificationEntity entity) {
        NotificationResponse response = new NotificationResponse();
        response.setId(entity.getId());
        response.setTitle(entity.getTitle());
        response.setMessage(entity.getMessage());
        response.setType(entity.getType());
        response.setRead(entity.isRead());
        response.setReadAt(entity.getReadAt());
        response.setReferenceType(entity.getReferenceType());
        response.setReferenceId(entity.getReferenceId());
        response.setPriority(entity.getPriority());
        response.setCreatedAt(entity.getCreatedAt());
        // Don't expose admin/delete fields to user
        return response;
    }

    /**
     * Convert to admin-facing response (includes all fields).
     */
    private NotificationResponse toAdminResponse(NotificationEntity entity) {
        NotificationResponse response = toUserResponse(entity);
        response.setDeletedByUser(entity.isDeletedByUser());
        response.setUserDeletedAt(entity.getUserDeletedAt());
        response.setDeletedByAdmin(entity.isDeletedByAdmin());
        response.setAdminDeletedAt(entity.getAdminDeletedAt());
        if (entity.getUser() != null) {
            response.setUser(new UserReferenceResponse(
                    entity.getUser().getId(),
                    entity.getUser().getFullName()
            ));
        }
        return response;
    }
}
