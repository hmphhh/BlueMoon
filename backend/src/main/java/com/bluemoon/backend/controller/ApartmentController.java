package com.bluemoon.backend.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import com.bluemoon.backend.dtos.request.ApartmentRequest;
import com.bluemoon.backend.dtos.response.ApartmentDetailsResponse;
import com.bluemoon.backend.dtos.response.ApartmentResponse;
import com.bluemoon.backend.entity.ApartmentEntity;
import com.bluemoon.backend.entity.UserEntity;
import com.bluemoon.backend.service.ApartmentService;

@RestController
@RequestMapping("/api/apartments")
public class ApartmentController {

    @Autowired
    private ApartmentService apartmentService;

    /**
     * GET /api/apartments — All apartments with user count.
     * Supports optional filters: search, status, type, floor.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<List<ApartmentResponse>> getAllApartments(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Integer floor
    ) {
        List<ApartmentResponse> apartments = apartmentService.getAllApartmentsWithUserCount();

        // Apply filters in-memory (simple approach since dataset is small)
        if (search != null && !search.isBlank()) {
            String s = search.toLowerCase();
            apartments = apartments.stream()
                    .filter(a -> a.getApartmentNumber() != null && a.getApartmentNumber().toLowerCase().contains(s))
                    .collect(Collectors.toList());
        }
        if (status != null && !status.isBlank()) {
            apartments = apartments.stream()
                    .filter(a -> a.getStatus() != null && a.getStatus().name().equals(status))
                    .collect(Collectors.toList());
        }
        if (type != null && !type.isBlank()) {
            apartments = apartments.stream()
                    .filter(a -> a.getType() != null && a.getType().name().equals(type))
                    .collect(Collectors.toList());
        }
        if (floor != null) {
            apartments = apartments.stream()
                    .filter(a -> a.getFloor() != null && a.getFloor().equals(floor))
                    .collect(Collectors.toList());
        }

        return ResponseEntity.ok(apartments);
    }

    /**
     * GET /api/apartments/{apartmentId} — Apartment details with users.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{apartmentId}")
    public ResponseEntity<ApartmentDetailsResponse> getApartmentDetails(@PathVariable Long apartmentId) {
        ApartmentEntity apartment = apartmentService.getApartmentById(apartmentId);
        List<UserEntity> users = apartmentService.getUsersByApartmentId(apartmentId);

        ApartmentDetailsResponse response = new ApartmentDetailsResponse();
        response.setId(apartment.getId());
        response.setApartmentNumber(apartment.getApartmentNumber());
        response.setFloor(apartment.getFloor());
        response.setArea(apartment.getArea());
        response.setStatus(apartment.getStatus());
        response.setType(apartment.getType());
        response.setUserCount(users.size());
        response.setUsers(users.stream().map(u -> {
            ApartmentDetailsResponse.UserDto dto = new ApartmentDetailsResponse.UserDto();
            dto.setId(u.getId());
            dto.setUsername(u.getUsername());
            dto.setFullName(u.getFullName());
            dto.setIdNumber(u.getIdNumber());
            dto.setPhone(u.getPhone());
            dto.setStatus(u.getStatus() != null ? u.getStatus().name() : null);
            dto.setRole(u.getRole() != null ? u.getRole().name() : null);
            return dto;
        }).collect(Collectors.toList()));

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/apartments/{apartmentId}/users — Users in apartment.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{apartmentId}/users")
    public ResponseEntity<List<ApartmentDetailsResponse.UserDto>> getUsersInApartment(@PathVariable Long apartmentId) {
        List<UserEntity> users = apartmentService.getUsersByApartmentId(apartmentId);
        List<ApartmentDetailsResponse.UserDto> dtos = users.stream().map(u -> {
            ApartmentDetailsResponse.UserDto dto = new ApartmentDetailsResponse.UserDto();
            dto.setId(u.getId());
            dto.setUsername(u.getUsername());
            dto.setFullName(u.getFullName());
            dto.setIdNumber(u.getIdNumber());
            dto.setPhone(u.getPhone());
            dto.setStatus(u.getStatus() != null ? u.getStatus().name() : null);
            dto.setRole(u.getRole() != null ? u.getRole().name() : null);
            return dto;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    /**
     * POST /api/apartments — Create apartment.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<ApartmentResponse> createApartment(@RequestBody ApartmentRequest request) {
        ApartmentEntity apartment = apartmentService.createApartment(request);
        ApartmentResponse response = new ApartmentResponse();
        response.setId(apartment.getId());
        response.setApartmentNumber(apartment.getApartmentNumber());
        response.setFloor(apartment.getFloor());
        response.setArea(apartment.getArea());
        response.setStatus(apartment.getStatus());
        response.setType(apartment.getType());
        response.setUserCount(0L);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * PATCH /api/apartments/{apartmentId} — Update apartment.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{apartmentId}")
    public ResponseEntity<ApartmentResponse> updateApartment(@PathVariable Long apartmentId,
                                                              @RequestBody ApartmentRequest request) {
        ApartmentEntity apartment = apartmentService.updateApartment(apartmentId, request);
        Long userCount = apartmentService.getActiveUserCount(apartmentId);
        ApartmentResponse response = new ApartmentResponse();
        response.setId(apartment.getId());
        response.setApartmentNumber(apartment.getApartmentNumber());
        response.setFloor(apartment.getFloor());
        response.setArea(apartment.getArea());
        response.setStatus(apartment.getStatus());
        response.setType(apartment.getType());
        response.setUserCount(userCount);
        return ResponseEntity.ok(response);
    }

    /**
     * DELETE /api/apartments/{apartmentId} — Delete apartment.
     * Returns 204 No Content on success.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{apartmentId}")
    public ResponseEntity<?> deleteApartment(@PathVariable Long apartmentId) {
        apartmentService.deleteApartment(apartmentId);
        return ResponseEntity.noContent().build();
    }

    /**
     * GET /api/apartments/me — Get current user's apartment.
     */
    @GetMapping("/me")
    public ResponseEntity<ApartmentResponse> getMyApartment() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        ApartmentEntity apartment = apartmentService.getApartmentForUser(username);
        ApartmentResponse response = new ApartmentResponse();
        response.setId(apartment.getId());
        response.setApartmentNumber(apartment.getApartmentNumber());
        response.setFloor(apartment.getFloor());
        response.setArea(apartment.getArea());
        response.setStatus(apartment.getStatus());
        response.setType(apartment.getType());
        response.setUserCount(apartmentService.getActiveUserCount(apartment.getId()));
        return ResponseEntity.ok(response);
    }
}
