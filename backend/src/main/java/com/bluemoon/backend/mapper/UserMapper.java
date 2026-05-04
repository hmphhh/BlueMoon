package com.bluemoon.backend.mapper;

import com.bluemoon.backend.entity.UserEntity;
import com.bluemoon.backend.service.dto.UserDTO;

/**
 * Maps between UserEntity and UserDTO.
 */
public class UserMapper {

    private UserMapper() {
        // Utility class
    }

    public static UserDTO toDTO(UserEntity entity) {
        if (entity == null) {
            return null;
        }
        UserDTO dto = new UserDTO();
        dto.setId(entity.getId());
        dto.setUsername(entity.getUsername());
        dto.setFullName(entity.getFullName());
        dto.setRole(entity.getRole());
        dto.setEmail(entity.getEmail());
        dto.setPhoneNumber(entity.getPhoneNumber());
        dto.setIdentityCardNumber(entity.getIdentityCardNumber());
        dto.setAvatarUrl(entity.getAvatarUrl());
        dto.setVerified(entity.isVerified());
        dto.setApartmentNumber(
                entity.getApartment() != null ? entity.getApartment().getApartmentNumber() : null
        );
        return dto;
    }
}
