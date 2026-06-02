package com.bluemoon.backend.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

import com.bluemoon.backend.dtos.request.ResidentRequest;
import com.bluemoon.backend.dtos.response.ResidentDetailsResponse;
import com.bluemoon.backend.dtos.response.ResidentResponse;
import com.bluemoon.backend.entity.ResidentEntity;

/**
 * MapStruct mapper for Resident-related transformations.
 * Uses NullValuePropertyMappingStrategy.IGNORE to skip null values during updates.
 */
@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface ResidentMapper {

    /**
     * Map ResidentEntity to ResidentResponse.
     */
    @Mapping(source = "apartment.id", target = "apartmentId")
    @Mapping(target = "linked", ignore = true)
    @Mapping(target = "apartmentNumber", ignore = true)
    ResidentResponse toResponse(ResidentEntity entity);

    /**
     * Map ResidentEntity to ResidentDetailsResponse (for /api/residents/{residentId} endpoint).
     */
    @Mapping(target = "linked", ignore = true)
    @Mapping(target = "apartment", ignore = true)
    @Mapping(target = "account", ignore = true)
    ResidentDetailsResponse toDetailsResponse(ResidentEntity entity);

    /**
     * Map ResidentRequest to ResidentEntity (without apartment).
     * Apartment must be set separately in the service.
     */
    @Mapping(target = "apartment", ignore = true)
    ResidentEntity toEntity(ResidentRequest request);

    /**
     * Update ResidentEntity from ResidentRequest, ignoring null values and apartment.
     * Apartment updates are handled separately in the service.
     */
    @Mapping(target = "apartment", ignore = true)
    void updateEntity(ResidentRequest request, @MappingTarget ResidentEntity entity);
}
