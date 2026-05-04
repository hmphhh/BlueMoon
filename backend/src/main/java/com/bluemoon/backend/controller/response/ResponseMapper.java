package com.bluemoon.backend.controller.response;

import com.bluemoon.backend.service.dto.ApartmentDTO;
import com.bluemoon.backend.service.dto.UserDTO;

/**
 * Maps DTOs to API response objects.
 * Lives in the controller layer because response shaping is a presentation concern.
 */
public class ResponseMapper {

    private ResponseMapper() {
        // Utility class
    }

    public static UserResponse toUserResponse(UserDTO dto) {
        if (dto == null) {
            return null;
        }
        UserResponse response = new UserResponse();
        response.setId(dto.getId());
        response.setUsername(dto.getUsername());
        response.setFullName(dto.getFullName());
        response.setRole(dto.getRole());
        response.setEmail(dto.getEmail());
        response.setPhoneNumber(dto.getPhoneNumber());
        response.setIdentityCardNumber(dto.getIdentityCardNumber());
        response.setAvatarUrl(dto.getAvatarUrl());
        response.setVerified(dto.isVerified());
        response.setApartmentNumber(dto.getApartmentNumber());
        return response;
    }

    public static ApartmentResponse toApartmentResponse(ApartmentDTO dto) {
        if (dto == null) {
            return null;
        }
        ApartmentResponse response = new ApartmentResponse();
        response.setId(dto.getId());
        response.setApartmentNumber(dto.getApartmentNumber());
        return response;
    }
}
