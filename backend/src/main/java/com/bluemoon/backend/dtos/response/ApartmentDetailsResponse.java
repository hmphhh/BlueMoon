package com.bluemoon.backend.dtos.response;

import com.bluemoon.backend.enums.ApartmentStatus;
import com.bluemoon.backend.enums.ApartmentType;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApartmentDetailsResponse {

    private Long id;
    private String apartmentNumber;
    private Integer floor;
    private Double area;
    private ApartmentStatus status;
    private ApartmentType type;
    private java.util.List<ResidentDto> residents;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResidentDto {
        private Long id;
        private String fullName;
        private String idNumber;
        private String phone;
        private String relationship;
        private String status;
        private String gender;
    }
}
