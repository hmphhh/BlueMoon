package com.bluemoon.backend.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.bluemoon.backend.repository.ApartmentRepository;
import com.bluemoon.backend.service.dto.ApartmentDTO;
import com.bluemoon.backend.mapper.ApartmentMapper;

@Service
public class ApartmentService {

    @Autowired
    private ApartmentRepository apartmentRepository;

    /**
     * Get all apartments.
     */
    public List<ApartmentDTO> getAllApartments() {
        return apartmentRepository.findAll().stream()
                .map(ApartmentMapper::toDTO)
                .collect(Collectors.toList());
    }
}
