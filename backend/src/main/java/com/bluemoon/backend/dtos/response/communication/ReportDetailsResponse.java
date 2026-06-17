package com.bluemoon.backend.dtos.response.communication;
import com.bluemoon.backend.dtos.response.auth.UserReferenceResponse;


import java.time.LocalDateTime;

import com.bluemoon.backend.enums.communication.ReportStatus;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Full report details response including creator and reviewer info.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReportDetailsResponse {

    private Long id;

    private String title;

    private String content;

    private ReportStatus status;

    private String reviewNote;

    private LocalDateTime createdAt;

    private LocalDateTime reviewedAt;

    private UserReferenceResponse createdBy;

    private String createdByApartmentNumber;

    private UserReferenceResponse reviewedBy;
}
