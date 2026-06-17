package com.bluemoon.backend.dtos.request.auth;

import java.time.LocalDate;

import com.bluemoon.backend.enums.auth.Gender;
import com.bluemoon.backend.enums.apartment.ResidentRelationship;
import com.bluemoon.backend.enums.apartment.ResidentStatus;

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
    private ResidentRelationship relationship;
    private ResidentStatus status;
    private Long apartmentId;
}
