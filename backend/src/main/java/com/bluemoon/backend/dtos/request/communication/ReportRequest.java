package com.bluemoon.backend.dtos.request.communication;

import lombok.Data;

/**
 * Request DTO for creating or updating a report.
 */
@Data
public class ReportRequest {

    private String title;

    private String content;
}
