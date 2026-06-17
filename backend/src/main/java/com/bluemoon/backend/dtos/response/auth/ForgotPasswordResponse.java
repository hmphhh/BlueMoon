package com.bluemoon.backend.dtos.response.auth;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Response for successful forgot password request.
 */
@Data
@AllArgsConstructor
public class ForgotPasswordResponse {

    private String message;
}
