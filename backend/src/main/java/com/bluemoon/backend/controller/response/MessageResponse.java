package com.bluemoon.backend.controller.response;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Generic message response for simple status messages.
 */
@Data
@AllArgsConstructor
public class MessageResponse {

    private String message;
}
