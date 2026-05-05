package com.bluemoon.backend.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.bluemoon.backend.repository.ApartmentRepository;
import com.bluemoon.backend.entity.ApartmentEntity;

@Service
public class ApartmentService {

    @Autowired
    private ApartmentRepository apartmentRepository;

    /**
     * Get all apartments.
     */
    public List<ApartmentEntity> getAllApartments() {
        return apartmentRepository.findAll();
    }
}
