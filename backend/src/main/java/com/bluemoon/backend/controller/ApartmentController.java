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

import com.bluemoon.backend.dtos.request.ApartmentRequest;
import com.bluemoon.backend.dtos.response.ApartmentDetailsResponse;
import com.bluemoon.backend.dtos.response.ApartmentResponse;
import com.bluemoon.backend.service.ApartmentService;
import com.bluemoon.backend.service.ResidentService;
import com.bluemoon.backend.mapper.ApartmentMapper;

@RestController
@RequestMapping("/api/apartments")
public class ApartmentController {

    @Autowired
    private ApartmentService apartmentService;

    @Autowired
    private ResidentService residentService;

    @Autowired
    private ApartmentMapper apartmentMapper;

    /**
     * Get all apartments (simplified with resident count).
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<List<ApartmentResponse>> getAllApartments() {
        List<ApartmentResponse> apartments = apartmentService.getAllApartments().stream()
                .map(apartment -> {
                    ApartmentResponse response = apartmentMapper.toResponse(apartment);
                    response.setResidentCount(apartmentService.getResidentCount(apartment.getId()));
                    return response;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(apartments);
    }

    /**
     * Get apartment details by ID with residents list.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{apartmentId}")
    public ResponseEntity<ApartmentDetailsResponse> getApartmentDetails(@PathVariable Long apartmentId) {
        var apartment = apartmentService.getApartmentById(apartmentId);
        ApartmentDetailsResponse response = apartmentMapper.toDetailsResponse(apartment);
        
        // Get all residents in this apartment
        List<ApartmentDetailsResponse.ResidentDto> residents = residentService.getResidentsByApartmentId(apartmentId)
                .stream()
                .map(resident -> {
                    ApartmentDetailsResponse.ResidentDto residentDto = new ApartmentDetailsResponse.ResidentDto();
                    residentDto.setId(resident.getId());
                    residentDto.setFullName(resident.getFullName());
                    residentDto.setIdNumber(resident.getIdNumber());
                    residentDto.setPhone(resident.getPhone());
                    residentDto.setRelationship(resident.getRelationship().toString());
                    residentDto.setStatus(resident.getStatus().toString());
                    residentDto.setGender(resident.getGender().toString());
                    return residentDto;
                })
                .collect(Collectors.toList());
        
        response.setResidents(residents);
        return ResponseEntity.ok(response);
    }

    /**
     * Get an apartment by apartment number.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/number/{number}")
    public ResponseEntity<ApartmentResponse> getApartmentByNumber(@PathVariable String number) {
        var apartment = apartmentService.getApartmentByNumber(number);
        ApartmentResponse response = apartmentMapper.toResponse(apartment);
        response.setResidentCount(apartmentService.getResidentCount(apartment.getId()));
        return ResponseEntity.ok(response);
    }

    /**
     * Create a new apartment.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<ApartmentResponse> createApartment(@RequestBody ApartmentRequest request) {
        var apartment = apartmentService.createApartment(request);
        ApartmentResponse response = apartmentMapper.toResponse(apartment);
        response.setResidentCount(apartmentService.getResidentCount(apartment.getId()));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Update an existing apartment using ApartmentRequest.
     * Null fields are ignored (not persisted).
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<ApartmentResponse> updateApartment(@PathVariable Long id,
            @RequestBody ApartmentRequest request) {
        var apartment = apartmentService.updateApartment(id, request);
        ApartmentResponse response = apartmentMapper.toResponse(apartment);
        response.setResidentCount(apartmentService.getResidentCount(apartment.getId()));
        return ResponseEntity.ok(response);
    }

    /**
     * Delete an apartment.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteApartment(@PathVariable Long id) {
        apartmentService.deleteApartment(id);
        return ResponseEntity.ok(Map.of("message", "Apartment deleted successfully"));
    }
}


