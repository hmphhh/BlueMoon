package com.bluemoon.backend.dtos.request;

import java.time.LocalDate;

import com.bluemoon.backend.enums.Gender;
import com.bluemoon.backend.enums.ResidentStatus;

import jakarta.validation.constraints.Email;
import lombok.Data;

/**
 * Request DTO for admin updating a user.
 * All fields are optional (PATCH semantics).
 */
@Data
public class UpdateUserRequest {

    @Email(message = "Email must be valid")
    private String email;

    private String fullName;
    private String phone;
    private LocalDate dateOfBirth;
    private Gender gender;
    private String relationship;
    private ResidentStatus status;
    private Long apartmentId;
}
