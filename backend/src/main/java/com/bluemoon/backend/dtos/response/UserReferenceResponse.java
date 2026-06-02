package com.bluemoon.backend.dtos.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Simple user reference with id and fullName.
 * Used in report detail responses.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserReferenceResponse {

    private Long id;

    private String fullName;
}
