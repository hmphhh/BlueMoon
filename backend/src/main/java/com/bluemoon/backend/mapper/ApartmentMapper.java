package com.bluemoon.backend.mapper;

import org.mapstruct.Mapper;

import com.bluemoon.backend.dtos.response.ApartmentResponse;
import com.bluemoon.backend.entity.ApartmentEntity;

/**
 * MapStruct mapper for Apartment-related transformations.
 */
@Mapper(componentModel = "spring")
public interface ApartmentMapper {

    /**
     * Map ApartmentEntity to ApartmentResponse.
     */
    ApartmentResponse toResponse(ApartmentEntity entity);
}
