package com.bluemoon.backend.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.bluemoon.backend.dtos.response.BillResponse;
import com.bluemoon.backend.entity.BillEntity;

/**
 * MapStruct mapper for Bill-related transformations.
 */
@Mapper(componentModel = "spring")
public interface BillMapper {

    /**
     * Map BillEntity to BillResponse.
     * Handles nested apartment and createdBy relationships.
     */
    @Mapping(target = "apartmentNumber", source = "apartment.apartmentNumber")
    @Mapping(target = "createdByName", source = "createdBy.fullName")
    BillResponse toResponse(BillEntity entity);
}
