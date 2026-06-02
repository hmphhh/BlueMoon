package com.bluemoon.backend.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

import com.bluemoon.backend.dtos.request.ApartmentRequest;
import com.bluemoon.backend.entity.ApartmentEntity;

/**
 * MapStruct mapper for Apartment-related transformations.
 * Uses NullValuePropertyMappingStrategy.IGNORE to skip null values during updates.
 */
@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface ApartmentMapper {

    /**
     * Map ApartmentRequest to ApartmentEntity.
     */
    @Mapping(source = "number", target = "apartmentNumber")
    ApartmentEntity toEntity(ApartmentRequest request);

    /**
     * Update ApartmentEntity from ApartmentRequest, ignoring null values.
     */
    @Mapping(source = "number", target = "apartmentNumber")
    void updateEntity(ApartmentRequest request, @MappingTarget ApartmentEntity entity);
}
