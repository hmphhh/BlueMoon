package com.bluemoon.backend.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

import com.bluemoon.backend.dtos.request.ApartmentRequest;
import com.bluemoon.backend.dtos.response.ApartmentDetailsResponse;
import com.bluemoon.backend.dtos.response.ApartmentResponse;
import com.bluemoon.backend.entity.ApartmentEntity;

/**
 * MapStruct mapper for Apartment-related transformations.
 * Uses NullValuePropertyMappingStrategy.IGNORE to skip null values during updates.
 */
@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface ApartmentMapper {

    /**
     * Map ApartmentEntity to ApartmentResponse.
     */
    @Mapping(source = "apartmentNumber", target = "number")
    @Mapping(target = "residentCount", ignore = true)
    ApartmentResponse toResponse(ApartmentEntity entity);

    /**
     * Map ApartmentEntity to ApartmentDetailsResponse (for /api/apartments/{apartmentId} endpoint).
     */
    @Mapping(source = "apartmentNumber", target = "apartmentNumber")
    @Mapping(target = "residents", ignore = true)
    ApartmentDetailsResponse toDetailsResponse(ApartmentEntity entity);

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
