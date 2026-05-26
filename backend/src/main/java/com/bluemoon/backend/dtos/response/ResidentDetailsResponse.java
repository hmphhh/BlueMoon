package com.bluemoon.backend.dtos.response;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResidentDetailsResponse {

    private Long id;
    private String fullName;
    private String idNumber;
    private String gender;
    private String relationship;
    private String phone;
    private String status;

    @JsonProperty("isLinked")
    private boolean isLinked;

    private ApartmentSimplifiedDto apartment;
    private AccountSimplifiedDto account;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ApartmentSimplifiedDto {
        private Long id;
        private String apartmentNumber;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AccountSimplifiedDto {
        private Long id;
        private String username;
        private String email;

        @JsonProperty("isVerified")
        private boolean isVerified;
    }
}
