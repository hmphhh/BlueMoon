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
        UserDetailsResponse response = userMapper.toDetailsResponse(user);
        
        if (user.getResident() != null) {
            UserDetailsResponse.ResidentDetailDto residentDto = new UserDetailsResponse.ResidentDetailDto();
            residentDto.setId(user.getResident().getId());
            residentDto.setFullName(user.getResident().getFullName());
            residentDto.setIdNumber(user.getResident().getIdNumber());
            residentDto.setDateOfBirth(user.getResident().getDateOfBirth().toString());
            residentDto.setGender(user.getResident().getGender().toString());
            residentDto.setPhone(user.getResident().getPhone());
            residentDto.setRelationship(user.getResident().getRelationship().toString());
            residentDto.setStatus(user.getResident().getStatus().toString());
            
            if (user.getResident().getApartment() != null) {
                UserDetailsResponse.ApartmentSimplifiedDto apartmentDto = new UserDetailsResponse.ApartmentSimplifiedDto();
                apartmentDto.setId(user.getResident().getApartment().getId());
                apartmentDto.setApartmentNumber(user.getResident().getApartment().getApartmentNumber());
                residentDto.setApartment(apartmentDto);
            }
            
            response.setResident(residentDto);
        }
        
        return ResponseEntity.ok(response);
    }

    /**
     * Create a new user.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<UserDetailsResponse> createUser(@Valid @RequestBody UserRequest request) {
        var createdUser = userService.createUser(request);
        UserDetailsResponse response = userMapper.toDetailsResponse(createdUser);
        
        if (createdUser.getResident() != null) {
            UserDetailsResponse.ResidentDetailDto residentDto = new UserDetailsResponse.ResidentDetailDto();
            residentDto.setId(createdUser.getResident().getId());
            residentDto.setFullName(createdUser.getResident().getFullName());
            residentDto.setIdNumber(createdUser.getResident().getIdNumber());
            residentDto.setDateOfBirth(createdUser.getResident().getDateOfBirth().toString());
            residentDto.setGender(createdUser.getResident().getGender().toString());
            residentDto.setPhone(createdUser.getResident().getPhone());
            residentDto.setRelationship(createdUser.getResident().getRelationship().toString());
            residentDto.setStatus(createdUser.getResident().getStatus().toString());
            
            if (createdUser.getResident().getApartment() != null) {
                UserDetailsResponse.ApartmentSimplifiedDto apartmentDto = new UserDetailsResponse.ApartmentSimplifiedDto();
                apartmentDto.setId(createdUser.getResident().getApartment().getId());
                apartmentDto.setApartmentNumber(createdUser.getResident().getApartment().getApartmentNumber());
                residentDto.setApartment(apartmentDto);
            }
            
            response.setResident(residentDto);
        }
        
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
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
        
        UserDetailsResponse response = userMapper.toDetailsResponse(updatedUser);
        
        if (updatedUser.getResident() != null) {
            UserDetailsResponse.ResidentDetailDto residentDto = new UserDetailsResponse.ResidentDetailDto();
            residentDto.setId(updatedUser.getResident().getId());
            residentDto.setFullName(updatedUser.getResident().getFullName());
            residentDto.setIdNumber(updatedUser.getResident().getIdNumber());
            residentDto.setDateOfBirth(updatedUser.getResident().getDateOfBirth().toString());
            residentDto.setGender(updatedUser.getResident().getGender().toString());
            residentDto.setPhone(updatedUser.getResident().getPhone());
            residentDto.setRelationship(updatedUser.getResident().getRelationship().toString());
            residentDto.setStatus(updatedUser.getResident().getStatus().toString());
            
            if (updatedUser.getResident().getApartment() != null) {
                UserDetailsResponse.ApartmentSimplifiedDto apartmentDto = new UserDetailsResponse.ApartmentSimplifiedDto();
                apartmentDto.setId(updatedUser.getResident().getApartment().getId());
                apartmentDto.setApartmentNumber(updatedUser.getResident().getApartment().getApartmentNumber());
                residentDto.setApartment(apartmentDto);
            }
            
            response.setResident(residentDto);
        }
        
        return ResponseEntity.ok(response);
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
