package com.bluemoon.backend.dtos.response.communication;

import java.time.LocalDateTime;

import com.bluemoon.backend.enums.communication.ReportStatus;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Summary response for a user's own report list.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReportSummaryResponse {

    private Long id;

    private String title;

    private ReportStatus status;

    private LocalDateTime createdAt;
}
