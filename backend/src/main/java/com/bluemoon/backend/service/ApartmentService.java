package com.bluemoon.backend.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.bluemoon.backend.entity.Apartment;
import com.bluemoon.backend.repository.ApartmentRepository;

@Service
public class ApartmentService {

    @Autowired
    private ApartmentRepository apartmentRepository;

    /**
     * Get all apartments.
     */
    public List<Apartment> getAllApartments() {
        return apartmentRepository.findAll();
    }
}
