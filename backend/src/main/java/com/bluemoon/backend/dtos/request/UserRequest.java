package com.bluemoon.backend.dtos.request;

import java.time.LocalDate;

import com.bluemoon.backend.enums.Gender;
import com.bluemoon.backend.enums.ResidentRelationship;
import com.bluemoon.backend.enums.UserRole;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Integrated request DTO for admin account creation.
 * Top section (→ UserEntity): phoneNumber, identityCardNumber, role.
 * Bottom section (→ ResidentEntity): fullName, dateOfBirth, gender, relationship, apartmentId.
 * Password is auto-set to BCrypt(identityCardNumber) on the backend.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserRequest {

    // Account fields → UserEntity
    @NotBlank(message = "Phone number is required")
    private String phoneNumber;

    @NotBlank(message = "Identity card number (CCCD) is required")
    private String identityCardNumber;

    private UserRole role; // defaults to USER if null

    // Resident fields → ResidentEntity (used when role = USER)
    private String fullName;
    private LocalDate dateOfBirth;
    private Gender gender;
    private ResidentRelationship relationship;
    private Long apartmentId;
}