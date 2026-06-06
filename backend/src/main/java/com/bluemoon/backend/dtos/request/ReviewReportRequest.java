package com.bluemoon.backend.dtos.request;

import com.bluemoon.backend.enums.ReportStatus;

import lombok.Data;

/**
 * Request DTO for reviewing (approving/rejecting) a report.
 */
@Data
public class ReviewReportRequest {

    private ReportStatus status;

    private String reviewNote;
}
