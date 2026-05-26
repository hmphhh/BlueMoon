package com.bluemoon.backend.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.bluemoon.backend.dtos.request.ResidentRequest;
import com.bluemoon.backend.entity.ApartmentEntity;
import com.bluemoon.backend.entity.ResidentEntity;
import com.bluemoon.backend.entity.UserEntity;
import com.bluemoon.backend.exceptions.InvalidOperationException;
import com.bluemoon.backend.exceptions.ResourceNotFoundException;
import com.bluemoon.backend.mapper.ResidentMapper;
import com.bluemoon.backend.repository.ApartmentRepository;
import com.bluemoon.backend.repository.ResidentRepository;

@Service
public class ResidentService {

    @Autowired
    private ResidentRepository residentRepository;

    @Autowired
    private ApartmentRepository apartmentRepository;

    @Autowired
    private ResidentMapper residentMapper;

    /**
     * Get all residents.
     */
    public List<ResidentEntity> getAllResidents() {
        return residentRepository.findAll();
    }

    /**
     * Get a resident by ID.
     * Throws ResourceNotFoundException if not found.
     */
    public ResidentEntity getResidentById(Long id) {
        return residentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resident not found with id: " + id));
    }

    /**
     * Get all residents in a specific apartment.
     */
    public List<ResidentEntity> getResidentsByApartmentId(Long apartmentId) {
        return residentRepository.findByApartmentId(apartmentId);
    }

    /**
     * Get a resident by ID number (CCCD).
     * Throws ResourceNotFoundException if not found.
     */
    public ResidentEntity getResidentByIdNumber(String idNumber) {
        return residentRepository.findByIdNumber(idNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Resident not found with id number: " + idNumber));
    }

    /**
     * Create a new resident.
     * Throws ResourceNotFoundException if apartment not found.
     * Throws InvalidOperationException if ID number already exists.
     */
    @Transactional
    public ResidentEntity createResident(ResidentRequest request) {
        // Check if ID number already exists
        if (residentRepository.findByIdNumber(request.getIdNumber()).isPresent()) {
            throw new InvalidOperationException("Resident with this ID number already exists");
        }

        // Fetch the apartment
        ApartmentEntity apartment = apartmentRepository.findById(request.getApartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Apartment not found with id: " + request.getApartmentId()));

        // Create and save the resident
        ResidentEntity resident = residentMapper.toEntity(request);
        resident.setApartment(apartment);

        return residentRepository.save(resident);
    }

    /**
     * Update an existing resident using ResidentRequest.
     * Null fields are ignored (not persisted).
     * Throws ResourceNotFoundException if resident not found.
     * Throws InvalidOperationException if ID number is already taken by another resident.
     */
    @Transactional
    public ResidentEntity updateResident(Long id, ResidentRequest request) {
        ResidentEntity resident = residentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resident not found with id: " + id));

        // Check if ID number is being changed and if the new one already exists
        if (request.getIdNumber() != null &&
                !request.getIdNumber().equals(resident.getIdNumber()) &&
                residentRepository.findByIdNumber(request.getIdNumber()).isPresent()) {
            throw new InvalidOperationException("ID number already in use");
        }

        // Update apartment if provided
        if (request.getApartmentId() != null) {
            ApartmentEntity apartment = apartmentRepository.findById(request.getApartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Apartment not found with id: " + request.getApartmentId()));
            resident.setApartment(apartment);
        }

        // Update resident fields (null values are ignored)
        residentMapper.updateEntity(request, resident);

        return residentRepository.save(resident);
    }

    /**
     * Link a resident to an apartment.
     * Throws ResourceNotFoundException if either resident or apartment not found.
     */
    @Transactional
    public ResidentEntity linkToApartment(Long residentId, Long apartmentId) {
        ResidentEntity resident = residentRepository.findById(residentId)
                .orElseThrow(() -> new ResourceNotFoundException("Resident not found with id: " + residentId));

        ApartmentEntity apartment = apartmentRepository.findById(apartmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Apartment not found with id: " + apartmentId));

        resident.setApartment(apartment);
        return residentRepository.save(resident);
    }

    /**
     * Delete a resident by ID.
     * Throws ResourceNotFoundException if not found.
     */
    @Transactional
    public void deleteResident(Long id) {
        ResidentEntity resident = residentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resident not found with id: " + id));
        residentRepository.delete(resident);
    }

    /**
     * Check if a resident is linked to a user (1-1 relationship).
     * Returns true if linked, false otherwise.
     */
    public boolean isResidentLinked(Long residentId) {
        return residentRepository.findLinkedUser(residentId).isPresent();
    }

    /**
     * Get the apartment number of a resident.
     * Returns null if resident has no apartment or apartment not found.
     */
    public String getApartmentNumber(Long residentId) {
        return residentRepository.getApartmentNumber(residentId).orElse(null);
    }

    /**
     * Get the user linked to a resident (1-1 relationship).
     * Returns null if no user is linked.
     */
    public UserEntity getLinkedUser(Long residentId) {
        return residentRepository.findLinkedUser(residentId).orElse(null);
    }
}

