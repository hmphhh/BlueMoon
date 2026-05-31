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

import com.bluemoon.backend.dtos.request.ResidentRequest;
import com.bluemoon.backend.dtos.response.ResidentDetailsResponse;
import com.bluemoon.backend.dtos.response.ResidentResponse;
import com.bluemoon.backend.service.ResidentService;
import com.bluemoon.backend.mapper.ResidentMapper;
import com.bluemoon.backend.entity.ResidentEntity;

@RestController
@RequestMapping("/api/residents")
public class ResidentController {

    @Autowired
    private ResidentService residentService;

    @Autowired
    private ResidentMapper residentMapper;

    /**
     * Get all residents (simplified with isLinked and apartmentNumber).
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<List<ResidentResponse>> getAllResidents() {
        List<ResidentResponse> residents = residentService.getAllResidents().stream()
                .map(resident -> {
                    ResidentResponse response = residentMapper.toResponse(resident);
                    response.setLinked(residentService.isResidentLinked(resident.getId()));
                    response.setApartmentNumber(residentService.getApartmentNumber(resident.getId()));
                    return response;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(residents);
    }

    /**
     * Get resident details by ID with account information.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{residentId}")
    public ResponseEntity<ResidentDetailsResponse> getResidentDetails(@PathVariable Long residentId) {
        var resident = residentService.getResidentById(residentId);
        ResidentDetailsResponse response = residentMapper.toDetailsResponse(resident);
        
        response.setLinked(residentService.isResidentLinked(residentId));
        
        if (resident.getApartment() != null) {
            ResidentDetailsResponse.ApartmentSimplifiedDto apartmentDto = new ResidentDetailsResponse.ApartmentSimplifiedDto();
            apartmentDto.setId(resident.getApartment().getId());
            apartmentDto.setApartmentNumber(resident.getApartment().getApartmentNumber());
            response.setApartment(apartmentDto);
        }
        
        var linkedUser = residentService.getLinkedUser(residentId);
        if (linkedUser != null) {
            ResidentDetailsResponse.AccountSimplifiedDto accountDto = new ResidentDetailsResponse.AccountSimplifiedDto();
            accountDto.setId(linkedUser.getId());
            accountDto.setUsername(linkedUser.getUsername());
            accountDto.setEmail(linkedUser.getEmail());
            accountDto.setVerified(linkedUser.getVerified());
            response.setAccount(accountDto);
        }
        
        return ResponseEntity.ok(response);
    }
    /**
     * Get a resident by ID number (CCCD).
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/idnumber/{idNumber}")
    public ResponseEntity<ResidentResponse> getResidentByIdNumber(@PathVariable String idNumber) {
        var resident = residentService.getResidentByIdNumber(idNumber);
        ResidentResponse response = residentMapper.toResponse(resident);
        response.setLinked(residentService.isResidentLinked(resident.getId()));
        response.setApartmentNumber(residentService.getApartmentNumber(resident.getId()));
        return ResponseEntity.ok(response);
    }

    /**
     * Create a new resident.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<ResidentResponse> createResident(@RequestBody ResidentRequest request) {
        var resident = residentService.createResident(request);
        ResidentResponse response = residentMapper.toResponse(resident);
        response.setLinked(residentService.isResidentLinked(resident.getId()));
        response.setApartmentNumber(residentService.getApartmentNumber(resident.getId()));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Update an existing resident using ResidentRequest.
     * Null fields are ignored (not persisted).
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<ResidentResponse> updateResident(@PathVariable Long id,
            @RequestBody ResidentRequest request) {
        var resident = residentService.updateResident(id, request);
        ResidentResponse response = residentMapper.toResponse(resident);
        response.setLinked(residentService.isResidentLinked(resident.getId()));
        response.setApartmentNumber(residentService.getApartmentNumber(resident.getId()));
        return ResponseEntity.ok(response);
    }

    /**
     * Delete a resident.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteResident(@PathVariable Long id) {
        residentService.deleteResident(id);
        return ResponseEntity.ok(Map.of("message", "Resident deleted successfully"));
    }
}

