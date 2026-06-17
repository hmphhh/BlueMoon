package com.bluemoon.backend.dtos.response.communication;
import com.bluemoon.backend.dtos.response.auth.UserReferenceResponse;


import java.time.LocalDateTime;

import com.bluemoon.backend.enums.communication.NotificationPriority;
import com.bluemoon.backend.enums.communication.NotificationReferenceType;
import com.bluemoon.backend.enums.communication.NotificationType;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for notification details.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {

    private Long id;
    private String title;
    private String message;
    private NotificationType type;
    private boolean read;
    private LocalDateTime readAt;
    private NotificationReferenceType referenceType;
    private Long referenceId;
    private NotificationPriority priority;
    private LocalDateTime createdAt;

    // Admin fields (null for user endpoints)
    private boolean deletedByUser;
    private LocalDateTime userDeletedAt;
    private boolean deletedByAdmin;
    private LocalDateTime adminDeletedAt;
    private UserReferenceResponse user;
}
