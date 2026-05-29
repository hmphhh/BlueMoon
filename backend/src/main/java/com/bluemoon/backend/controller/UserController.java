package com.bluemoon.backend.controller;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bluemoon.backend.dtos.request.UserRequest;
import com.bluemoon.backend.dtos.response.UserDetailsResponse;
import com.bluemoon.backend.dtos.response.UserResponse;
import com.bluemoon.backend.mapper.UserMapper;
import com.bluemoon.backend.mapper.ResidentMapper;
import com.bluemoon.backend.service.UserService;
import com.bluemoon.backend.entity.UserEntity;
import com.bluemoon.backend.entity.ResidentEntity;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private ResidentMapper residentMapper;

    /**
     * Helper: build UserDetailsResponse with null-safe resident DTO.
     */
    private UserDetailsResponse buildDetailsResponse(UserEntity user) {
        UserDetailsResponse response = userMapper.toDetailsResponse(user);

        if (user.getResident() != null) {
            ResidentEntity r = user.getResident();
            UserDetailsResponse.ResidentDetailDto residentDto = new UserDetailsResponse.ResidentDetailDto();
            residentDto.setId(r.getId());
            residentDto.setFullName(r.getFullName());
            residentDto.setIdNumber(r.getIdNumber());
            residentDto.setDateOfBirth(r.getDateOfBirth() != null ? r.getDateOfBirth().toString() : null);
            residentDto.setGender(r.getGender() != null ? r.getGender().toString() : null);
            residentDto.setPhone(r.getPhone());
            residentDto.setRelationship(r.getRelationship() != null ? r.getRelationship().toString() : null);
            residentDto.setStatus(r.getStatus() != null ? r.getStatus().toString() : null);

            if (r.getApartment() != null) {
                UserDetailsResponse.ApartmentSimplifiedDto apartmentDto = new UserDetailsResponse.ApartmentSimplifiedDto();
                apartmentDto.setId(r.getApartment().getId());
                apartmentDto.setApartmentNumber(r.getApartment().getApartmentNumber());
                residentDto.setApartment(apartmentDto);
            }

            response.setResident(residentDto);
        }

        return response;
    }

    /**
     * Get all users (simplified view with isLinked field).
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        List<UserResponse> users = userService.getAllUsers().stream()
                .map(user -> {
                    UserResponse response = userMapper.toResponse(user);
                    response.setLinked(user.getResident() != null);
                    return response;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    /**
     * Get user details by ID with resident information.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{userId}")
    public ResponseEntity<UserDetailsResponse> getUserDetails(@PathVariable Long userId) {
        var user = userService.getUserById(userId);
        return ResponseEntity.ok(buildDetailsResponse(user));
    }

    /**
     * Create a new user.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<UserDetailsResponse> createUser(@Valid @RequestBody UserRequest request) {
        var createdUser = userService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(buildDetailsResponse(createdUser));
    }

    /**
     * Update user by linking/unlinking to a resident.
     * Request body should contain residentId (null to unlink).
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{userId}")
    public ResponseEntity<UserDetailsResponse> updateUser(@PathVariable Long userId, @RequestBody Map<String, Object> request) {
        Long residentId = request.get("residentId") != null ? ((Number) request.get("residentId")).longValue() : null;

        UserEntity updatedUser;
        if (residentId == null) {
            updatedUser = userService.unlinkFromResident(userId);
        } else {
            updatedUser = userService.linkToResident(userId, residentId);
        }

        return ResponseEntity.ok(buildDetailsResponse(updatedUser));
    }

    /**
     * Delete a user.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
    }
}
