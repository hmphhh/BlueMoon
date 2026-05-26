package com.bluemoon.backend.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.bluemoon.backend.dtos.request.ApartmentRequest;
import com.bluemoon.backend.entity.ApartmentEntity;
import com.bluemoon.backend.enums.ApartmentStatus;
import com.bluemoon.backend.enums.ApartmentType;
import com.bluemoon.backend.exceptions.InvalidOperationException;
import com.bluemoon.backend.exceptions.ResourceNotFoundException;
import com.bluemoon.backend.mapper.ApartmentMapper;
import com.bluemoon.backend.repository.ApartmentRepository;

@Service
public class ApartmentService {

    @Autowired
    private ApartmentRepository apartmentRepository;

    @Autowired
    private ApartmentMapper apartmentMapper;

    /**
     * Get all apartments.
     */
    public List<ApartmentEntity> getAllApartments() {
        return apartmentRepository.findAll();
    }

    /**
     * Get an apartment by ID.
     * Throws ResourceNotFoundException if not found.
     */
    public ApartmentEntity getApartmentById(Long id) {
        return apartmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Apartment not found with id: " + id));
    }

    /**
     * Get an apartment by apartment number.
     * Throws ResourceNotFoundException if not found.
     */
    public ApartmentEntity getApartmentByNumber(String number) {
        return apartmentRepository.findByApartmentNumber(number)
                .orElseThrow(() -> new ResourceNotFoundException("Apartment not found with number: " + number));
    }

    /**
     * Create a new apartment.
     * Throws InvalidOperationException if apartment number already exists.
     */
    @Transactional
    public ApartmentEntity createApartment(ApartmentRequest request) {
        // Check if apartment number already exists
        if (apartmentRepository.findByApartmentNumber(request.getNumber()).isPresent()) {
            throw new InvalidOperationException("Apartment with this number already exists");
        }

        ApartmentEntity apartment = apartmentMapper.toEntity(request);
        apartment.setStatus(ApartmentStatus.VACANT);

        return apartmentRepository.save(apartment);
    }

    /**
     * Update an existing apartment using ApartmentRequest.
     * Null fields are ignored (not persisted).
     * Throws ResourceNotFoundException if not found.
     * Throws InvalidOperationException if apartment number is already taken by another apartment.
     */
    @Transactional
    public ApartmentEntity updateApartment(Long id, ApartmentRequest request) {
        ApartmentEntity apartment = apartmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Apartment not found with id: " + id));

        // Check if apartment number is being changed and if the new one already exists
        if (request.getNumber() != null &&
                !request.getNumber().equals(apartment.getApartmentNumber()) &&
                apartmentRepository.findByApartmentNumber(request.getNumber()).isPresent()) {
            throw new InvalidOperationException("Apartment number already in use");
        }

        // Update fields (null values are ignored)
        apartmentMapper.updateEntity(request, apartment);

        return apartmentRepository.save(apartment);
    }

    /**
     * Delete an apartment by ID.
     * Throws ResourceNotFoundException if not found.
     */
    @Transactional
    public void deleteApartment(Long id) {
        ApartmentEntity apartment = apartmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Apartment not found with id: " + id));
        apartmentRepository.delete(apartment);
    }

    /**
     * Get the count of residents in an apartment.
     * Uses JPQL to avoid N+1 queries.
     */
    public Integer getResidentCount(Long apartmentId) {
        Long count = apartmentRepository.countResidentsByApartmentId(apartmentId);
        return count != null ? count.intValue() : 0;
    }
}

