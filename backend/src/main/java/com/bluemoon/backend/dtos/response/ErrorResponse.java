package com.bluemoon.backend.dtos.response;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Generic error response for error messages.
 */
@Data
@AllArgsConstructor
public class ErrorResponse {

    private String error;
}
