package com.bluemoon.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.bluemoon.backend.dtos.request.RegisterRequest;
import com.bluemoon.backend.dtos.response.LoginResponse;
import com.bluemoon.backend.exceptions.DuplicateResourceException;
import com.bluemoon.backend.exceptions.InvalidCredentialsException;
import com.bluemoon.backend.exceptions.InvalidOperationException;
import com.bluemoon.backend.exceptions.ResourceNotFoundException;
import com.bluemoon.backend.repository.ApartmentRepository;
import com.bluemoon.backend.repository.UserRepository;
import com.bluemoon.backend.entity.ApartmentEntity;
import com.bluemoon.backend.entity.UserEntity;
import com.bluemoon.backend.security.JwtUtil;

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
     * Returns the created UserEntity on success.
     * Throws DuplicateResourceException if phone number or CCCD already registered.
     * Throws InvalidOperationException if apartment not found or not required.
     */
    public UserEntity register(RegisterRequest request) {
        String phoneNumber = request.getPhoneNumber();
        String identityCardNumber = request.getIdentityCardNumber();
        String apartmentNumber = request.getApartmentNumber();
        String role = request.getRole() != null ? request.getRole().trim().toUpperCase() : "USER";

        // Check if phone number (username) already taken
        if (userRepository.findByUsername(phoneNumber).isPresent()) {
            throw new DuplicateResourceException("Phone number already registered");
        }

        // Check if CCCD already taken
        if (userRepository.findByIdentityCardNumber(identityCardNumber).isPresent()) {
            throw new DuplicateResourceException("Identity card number already registered");
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
                throw new InvalidOperationException("Apartment number is required for residents");
            }
            ApartmentEntity apartment = apartmentRepository.findByApartmentNumber(apartmentNumber)
                    .orElseThrow(() -> new ResourceNotFoundException("Apartment not found: " + apartmentNumber));
            user.setApartment(apartment);
        }
        // ADMIN accounts: no apartment attached

        return userRepository.save(user);
    }

    /**
     * Authenticate user and return login response.
     * Throws InvalidCredentialsException if username or password is incorrect.
     */
    public LoginResponse login(String username, String password) {
        UserEntity user = userRepository.findByUsername(username)
                .orElseThrow(() -> new InvalidCredentialsException("Invalid username or password"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new InvalidCredentialsException("Invalid username or password");
        }

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
    }
}
