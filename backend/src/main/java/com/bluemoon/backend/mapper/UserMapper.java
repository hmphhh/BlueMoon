package com.bluemoon.backend.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.NullValuePropertyMappingStrategy;

import com.bluemoon.backend.dtos.response.ProfileResponse;
import com.bluemoon.backend.dtos.response.UserDetailsResponse;
import com.bluemoon.backend.dtos.response.UserResponse;
import com.bluemoon.backend.entity.UserEntity;

/**
 * MapStruct mapper for User-related transformations.
 * Uses NullValuePropertyMappingStrategy.IGNORE to skip null values during updates.
 */
@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface UserMapper {

    /**
     * Map UserEntity to UserResponse.
     */
    UserResponse toResponse(UserEntity entity);

    /**
     * Map UserEntity to ProfileResponse (for /api/me endpoint).
     */
    @Mapping(target = "resident", ignore = true)
    ProfileResponse toProfileResponse(UserEntity entity);

    /**
     * Map UserEntity to UserDetailsResponse (for /api/users/{userId} endpoint).
     */
    @Mapping(target = "resident", ignore = true)
    UserDetailsResponse toDetailsResponse(UserEntity entity);
}
