package com.bluemoon.backend.dtos.request;

import java.time.LocalDate;

import com.bluemoon.backend.enums.Gender;
import com.bluemoon.backend.enums.ResidentRelationship;
import com.bluemoon.backend.enums.ResidentStatus;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResidentRequest {
    private String fullName;
    private String phone;
    private LocalDate dateOfBirth;
    private Gender gender;
    private String idNumber;
    private ResidentRelationship relationship;
    private ResidentStatus status;
    private Long apartmentId;
}
