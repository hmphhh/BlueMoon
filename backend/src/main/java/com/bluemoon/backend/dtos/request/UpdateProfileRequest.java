package com.bluemoon.backend.dtos.request;

import java.time.LocalDate;

import com.bluemoon.backend.enums.Gender;
import com.bluemoon.backend.enums.ResidentRelationship;

import jakarta.validation.constraints.Email;
import lombok.Data;

/**
 * Request DTO for user self-updating their profile.
 * Only these fields are allowed to be updated by the user themselves.
 */
@Data
public class UpdateProfileRequest {

    @Email(message = "Email must be valid")
    private String email;

    private String fullName;
    private String phone;
    private LocalDate dateOfBirth;
    private Gender gender;
    private ResidentRelationship relationship;
}
