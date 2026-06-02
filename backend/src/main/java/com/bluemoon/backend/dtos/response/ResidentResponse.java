package com.bluemoon.backend.dtos.response;

import java.time.LocalDate;

import com.bluemoon.backend.enums.Gender;
import com.bluemoon.backend.enums.ResidentRelationship;
import com.bluemoon.backend.enums.ResidentStatus;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResidentResponse {

    private Long id;
    private String fullName;
    private String phone;
    private LocalDate dateOfBirth;
    private Gender gender;
    private String idNumber;
    private ResidentRelationship relationship;
    private ResidentStatus status;
    private Long apartmentId;

    @JsonProperty("linked")
    private boolean linked;

    private String apartmentNumber;
}
