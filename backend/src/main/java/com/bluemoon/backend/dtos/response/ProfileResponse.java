package com.bluemoon.backend.dtos.response;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProfileResponse {

    private Long id;
    private String email;

    @JsonProperty("isVerified")
    private boolean verified;

    private ResidentProfileDto resident;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResidentProfileDto {
        private Long id;
        private String fullName;
        private String idNumber;
        private String dateOfBirth;
        private String gender;
        private String phone;
        private String relationship;
        private String status;
        private ApartmentSimplifiedDto apartment;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ApartmentSimplifiedDto {
        private Long id;
        private String apartmentNumber;
    }
}
