package com.bluemoon.backend.mapper;

import com.bluemoon.backend.entity.ApartmentEntity;
import com.bluemoon.backend.service.dto.ApartmentDTO;

/**
 * Maps between ApartmentEntity and ApartmentDTO.
 */
public class ApartmentMapper {

    private ApartmentMapper() {
        // Utility class
    }

    public static ApartmentDTO toDTO(ApartmentEntity entity) {
        if (entity == null) {
            return null;
        }
        ApartmentDTO dto = new ApartmentDTO();
        dto.setId(entity.getId());
        dto.setApartmentNumber(entity.getApartmentNumber());
        return dto;
    }
}
