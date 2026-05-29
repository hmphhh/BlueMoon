package com.bluemoon.backend.dtos.response;

import java.time.LocalDateTime;

import com.bluemoon.backend.enums.UserRole;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDetailsResponse {

    private Long id;
    private String username;
    private String phoneNumber;
    private String identityCardNumber;
    private String email;

    @JsonProperty("verified")
    private boolean verified;

    private UserRole role;

    @JsonProperty("createdAt")
    private LocalDateTime createdAt;

    private ResidentDetailDto resident;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResidentDetailDto {
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
