package com.bluemoon.backend.service.apartment;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.bluemoon.backend.dtos.request.apartment.ApartmentRequest;
import com.bluemoon.backend.dtos.response.apartment.ApartmentResponse;
import com.bluemoon.backend.entity.apartment.ApartmentEntity;
import com.bluemoon.backend.entity.auth.UserEntity;
import com.bluemoon.backend.enums.apartment.ApartmentStatus;
import com.bluemoon.backend.enums.apartment.ResidentStatus;
import com.bluemoon.backend.exceptions.InvalidOperationException;
import com.bluemoon.backend.exceptions.ResourceNotFoundException;
import com.bluemoon.backend.mapper.apartment.ApartmentMapper;
import com.bluemoon.backend.repository.apartment.ApartmentRepository;
import com.bluemoon.backend.repository.auth.UserRepository;

@Service
public class ApartmentService {

    @Autowired
    private ApartmentRepository apartmentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ApartmentMapper apartmentMapper;

    /**
     * Get all apartments with user count (JPQL).
     */
    public List<ApartmentResponse> getAllApartmentsWithUserCount() {
        return apartmentRepository.findAllWithUserCount();
    }

    /**
     * Get all apartments (entity list).
     */
    public List<ApartmentEntity> getAllApartments() {
        return apartmentRepository.findAll();
    }

    /**
     * Get an apartment by ID.
     */
    public ApartmentEntity getApartmentById(Long id) {
        return apartmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Apartment not found with id: " + id));
    }

    /**
     * Get an apartment by apartment number.
     */
    public ApartmentEntity getApartmentByNumber(String number) {
        return apartmentRepository.findByApartmentNumber(number)
                .orElseThrow(() -> new ResourceNotFoundException("Apartment not found with number: " + number));
    }

    /**
     * Create a new apartment.
     */
    @Transactional
    public ApartmentEntity createApartment(ApartmentRequest request) {
        if (apartmentRepository.findByApartmentNumber(request.getNumber()).isPresent()) {
            throw new InvalidOperationException("Apartment with this number already exists");
        }

        ApartmentEntity apartment = apartmentMapper.toEntity(request);
        apartment.setStatus(ApartmentStatus.VACANT);

        return apartmentRepository.save(apartment);
    }

    /**
     * Update an existing apartment. Status cannot be changed by admin.
     */
    @Transactional
    public ApartmentEntity updateApartment(Long id, ApartmentRequest request) {
        ApartmentEntity apartment = apartmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Apartment not found with id: " + id));

        if (request.getNumber() != null &&
                !request.getNumber().equals(apartment.getApartmentNumber()) &&
                apartmentRepository.findByApartmentNumber(request.getNumber()).isPresent()) {
            throw new InvalidOperationException("Apartment number already in use");
        }

        apartmentMapper.updateEntity(request, apartment);

        return apartmentRepository.save(apartment);
    }

    /**
     * Delete an apartment. Only allowed if no users are assigned.
     */
    @Transactional
    public void deleteApartment(Long id) {
        ApartmentEntity apartment = apartmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Apartment not found with id: " + id));

        Long userCount = apartmentRepository.countUsersByApartmentId(id);
        if (userCount != null && userCount > 0) {
            throw new InvalidOperationException("Apartment still contains users.");
        }

        apartmentRepository.delete(apartment);
    }

    /**
     * Get active user count for an apartment (excludes MOVED_OUT).
     */
    public Long getActiveUserCount(Long apartmentId) {
        Long count = apartmentRepository.countActiveUsersByApartmentId(apartmentId, ResidentStatus.MOVED_OUT);
        return count != null ? count : 0L;
    }

    /**
     * Get users assigned to an apartment.
     */
    public List<UserEntity> getUsersByApartmentId(Long apartmentId) {
        return userRepository.findByApartmentId(apartmentId);
    }

    /**
     * Auto-update apartment status based on active user count (excludes MOVED_OUT).
     * If active count == 0 → VACANT, if active count > 0 → OCCUPIED.
     */
    @Transactional
    public void updateApartmentStatusByUserCount(Long apartmentId) {
        ApartmentEntity apartment = apartmentRepository.findById(apartmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Apartment not found with id: " + apartmentId));

        Long count = getActiveUserCount(apartmentId);
        if (count == 0) {
            apartment.setStatus(ApartmentStatus.VACANT);
        } else {
            apartment.setStatus(ApartmentStatus.OCCUPIED);
        }
        apartmentRepository.save(apartment);
    }

    /**
     * Get apartment for the current user.
     */
    public ApartmentEntity getApartmentForUser(String username) {
        UserEntity user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        if (user.getApartment() == null) {
            throw new InvalidOperationException("User is not assigned to any apartment.");
        }

        return user.getApartment();
    }
}
