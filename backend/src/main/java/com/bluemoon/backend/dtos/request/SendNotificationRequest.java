package com.bluemoon.backend.dtos.request;

import java.util.List;

import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for creating manual notifications from a template.
 */
@Data
@NoArgsConstructor
public class SendNotificationRequest {

    /** ID of the notification template to use for content. */
    private Long templateId;

    /** List of user IDs to send the notification to. */
    private List<Long> userIds;

    /** If true, sends as URGENT_ANNOUNCEMENT instead of ANNOUNCEMENT. */
    private boolean urgent;
}
