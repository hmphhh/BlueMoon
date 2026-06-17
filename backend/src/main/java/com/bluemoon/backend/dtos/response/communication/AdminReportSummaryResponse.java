package com.bluemoon.backend.dtos.response.communication;

import java.time.LocalDateTime;

import com.bluemoon.backend.enums.communication.ReportStatus;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Summary response for admin report list (includes reporter info).
 * Uses constructor-based JPQL projection to avoid N+1.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminReportSummaryResponse {

    private Long id;

    private String title;

    private ReportStatus status;

    private ReporterResponse createdBy;

    private LocalDateTime createdAt;

    /**
     * Constructor used by JPQL constructor expression.
     */
    public AdminReportSummaryResponse(Long id, String title, ReportStatus status,
                                       Long userId, String fullName, String apartmentNumber,
                                       LocalDateTime createdAt) {
        this.id = id;
        this.title = title;
        this.status = status;
        this.createdBy = new ReporterResponse(userId, fullName, apartmentNumber);
        this.createdAt = createdAt;
    }
}
