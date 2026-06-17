package com.bluemoon.backend.dtos.request.communication;

import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for creating/updating a notification template.
 */
@Data
@NoArgsConstructor
public class NotificationTemplateRequest {

    private String title;
    private String message;
}
