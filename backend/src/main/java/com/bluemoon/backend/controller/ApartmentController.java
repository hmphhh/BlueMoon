package com.bluemoon.backend.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bluemoon.backend.dtos.response.ApartmentResponse;
import com.bluemoon.backend.mapper.ApartmentMapper;
import com.bluemoon.backend.service.ApartmentService;

@RestController
@RequestMapping("/api/apartments")
public class ApartmentController {

    @Autowired
    private ApartmentService apartmentService;

    @Autowired
    private ApartmentMapper apartmentMapper;

    /**
     * Get all apartments — used by admin form to populate the dropdown.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<List<ApartmentResponse>> getAllApartments() {
        List<ApartmentResponse> apartments = apartmentService.getAllApartments().stream()
                .map(apartmentMapper::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(apartments);
    }
}
