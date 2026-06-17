package com.bluemoon.backend.dtos.response.communication;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for notification template details.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationTemplateResponse {

    private Long id;
    private String title;
    private String message;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
