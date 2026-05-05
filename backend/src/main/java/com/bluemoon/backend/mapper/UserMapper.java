package com.bluemoon.backend.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.bluemoon.backend.dtos.response.UserResponse;
import com.bluemoon.backend.entity.UserEntity;

/**
 * MapStruct mapper for User-related transformations.
 */
@Mapper(componentModel = "spring")
public interface UserMapper {

    /**
     * Map UserEntity to UserResponse.
     * Handles nested apartment relationship and extracts apartment number.
     */
    @Mapping(target = "apartmentNumber", source = "apartment.apartmentNumber")
    UserResponse toResponse(UserEntity entity);
}
