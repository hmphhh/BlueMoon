package com.bluemoon.backend.dtos.request;

import java.time.LocalDate;

import com.bluemoon.backend.enums.Gender;

import jakarta.validation.constraints.Email;
import lombok.Data;

/**
 * Request body for updating user profile.
 * Only these fields are allowed to be updated.
 */
@Data
public class UpdateProfileRequest {
    @Email(message = "Email must be valid")
    private String email;

    private ResidentProfileUpdateDto resident;

    @Data
    public static class ResidentProfileUpdateDto {
        private String fullName;
        private LocalDate dateOfBirth;
        private String phone;
        private Gender gender;
    }
}
