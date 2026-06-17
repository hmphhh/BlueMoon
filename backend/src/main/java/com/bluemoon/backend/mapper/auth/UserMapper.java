package com.bluemoon.backend.mapper.auth;
import com.bluemoon.backend.controller.auth.UserController;


import org.mapstruct.Mapper;
import org.mapstruct.NullValuePropertyMappingStrategy;

/**
 * MapStruct mapper for User-related transformations.
 * Most mapping is now done manually in the controller due to flat DTO structure.
 */
@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface UserMapper {
    // Manual mapping is used in UserController for all response types
    // since the entity-to-DTO mapping requires conditional logic for apartment/status enums.
}
