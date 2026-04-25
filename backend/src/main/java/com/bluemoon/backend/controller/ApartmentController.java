package com.bluemoon.backend.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.bluemoon.backend.repository.ApartmentRepository;
import com.bluemoon.backend.entity.Apartment;

@RestController
@RequestMapping("/api/apartments")
public class ApartmentController {

    @Autowired
    private ApartmentRepository apartmentRepository;

    /**
     * Get all apartments — used by admin form to populate the dropdown.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<List<Apartment>> getAllApartments() {
        return ResponseEntity.ok(apartmentRepository.findAll());
    }
}
