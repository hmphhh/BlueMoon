package com.bluemoon.backend.dtos.request;

import java.time.LocalDate;

import com.bluemoon.backend.enums.Gender;
import com.bluemoon.backend.enums.UserRole;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for creating a new user account (Admin only).
 * Phone number is used as the login username.
 * ID number (CCCD) is automatically encrypted as the default password.
 * For USER role: all fields including apartmentId are required.
 * For ADMIN role: phone, idNumber, fullName, dateOfBirth, gender are required; relationship and apartmentId are ignored.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateUserRequest {

    @NotBlank(message = "Phone number is required")
    private String phone;

    @NotBlank(message = "ID number (CCCD) is required")
    private String idNumber;

    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotNull(message = "Date of birth is required")
    private LocalDate dateOfBirth;

    @NotNull(message = "Gender is required")
    private Gender gender;

    @NotNull(message = "Role is required")
    private UserRole role;

    // Resident fields (required when role = USER)
    private String relationship;
    private Long apartmentId;
}
