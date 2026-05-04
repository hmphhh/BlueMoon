package com.bluemoon.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.bluemoon.backend.controller.request.RegisterRequest;
import com.bluemoon.backend.controller.response.LoginResponse;
import com.bluemoon.backend.repository.ApartmentRepository;
import com.bluemoon.backend.repository.UserRepository;
import com.bluemoon.backend.entity.ApartmentEntity;
import com.bluemoon.backend.entity.UserEntity;
import com.bluemoon.backend.security.JwtUtil;
import com.bluemoon.backend.service.dto.UserDTO;
import com.bluemoon.backend.mapper.UserMapper;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ApartmentRepository apartmentRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    /**
     * Register a new user (admin action).
     * Returns the created UserDTO on success.
     * Throws IllegalArgumentException on validation failure.
     */
    public UserDTO register(RegisterRequest request) {
        String phoneNumber = request.getPhoneNumber();
        String identityCardNumber = request.getIdentityCardNumber();
        String apartmentNumber = request.getApartmentNumber();
        String role = request.getRole() != null ? request.getRole().trim().toUpperCase() : "USER";

        // Check if phone number (username) already taken
        if (userRepository.findByUsername(phoneNumber).isPresent()) {
            throw new IllegalArgumentException("Phone number already registered");
        }

        // Check if CCCD already taken
        if (userRepository.findByIdentityCardNumber(identityCardNumber).isPresent()) {
            throw new IllegalArgumentException("CCCD already registered");
        }

        UserEntity user = new UserEntity();
        user.setUsername(phoneNumber);          // username = phone number
        user.setPassword(passwordEncoder.encode(identityCardNumber)); // password = BCrypt(CCCD)
        user.setPhoneNumber(phoneNumber);
        user.setIdentityCardNumber(identityCardNumber);
        user.setRole(role);

        // Only link apartment for USER role
        if ("USER".equals(role)) {
            if (apartmentNumber == null || apartmentNumber.isBlank()) {
                throw new IllegalArgumentException("Apartment number is required for residents");
            }
            ApartmentEntity apartment = apartmentRepository.findByApartmentNumber(apartmentNumber)
                    .orElseThrow(() -> new IllegalArgumentException("Apartment " + apartmentNumber + " not found"));
            user.setApartment(apartment);
        }
        // ADMIN accounts: no apartment attached

        UserEntity savedUser = userRepository.save(user);
        return UserMapper.toDTO(savedUser);
    }

    /**
     * Authenticate user and return login response.
     * Returns LoginResponse on success, or null on failure.
     */
    public LoginResponse login(String username, String password) {
        return userRepository.findByUsername(username)
                .filter(user -> passwordEncoder.matches(password, user.getPassword()))
                .map(user -> {
                    String token = jwtUtil.generateToken(user.getUsername(), user.getRole());
                    String apartmentNumber = user.getApartment() != null
                            ? user.getApartment().getApartmentNumber()
                            : null;
                    return new LoginResponse(
                            token,
                            user.getId(),
                            user.getUsername(),
                            user.getRole(),
                            user.getFullName(),
                            apartmentNumber
                    );
                })
                .orElse(null);
    }
}
