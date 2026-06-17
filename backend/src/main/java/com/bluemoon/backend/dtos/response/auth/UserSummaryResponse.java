package com.bluemoon.backend.dtos.response.auth;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * User summary used in invoice/payment responses.
 * Reusable DTO matching the API spec's UserSummaryResponse.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserSummaryResponse {

    private Long id;
    private String fullName;
}
