package com.bluemoon.backend.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.bluemoon.backend.controller.response.ApartmentResponse;
import com.bluemoon.backend.controller.response.ResponseMapper;
import com.bluemoon.backend.service.ApartmentService;

@RestController
@RequestMapping("/api/apartments")
public class ApartmentController {

    @Autowired
    private ApartmentService apartmentService;

    /**
     * Get all apartments — used by admin form to populate the dropdown.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<List<ApartmentResponse>> getAllApartments() {
        List<ApartmentResponse> apartments = apartmentService.getAllApartments().stream()
                .map(ResponseMapper::toApartmentResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(apartments);
    }
}
