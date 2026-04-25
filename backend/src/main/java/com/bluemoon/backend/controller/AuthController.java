package com.bluemoon.backend.controller;

import java.util.HashMap;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.bluemoon.backend.repository.UserRepository;
import com.bluemoon.backend.repository.ApartmentRepository;
import com.bluemoon.backend.entity.User;
import com.bluemoon.backend.entity.Apartment;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.access.prepost.PreAuthorize;
import com.bluemoon.backend.security.JwtUtil;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ApartmentRepository apartmentRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    /**
     * Admin registers a new account.
     * Body: { phoneNumber, identityCardNumber, apartmentNumber (optional for ADMIN), role (optional, default USER) }
     * Logic: username = phoneNumber, password = BCrypt(identityCardNumber)
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> body) {
        String phoneNumber = body.get("phoneNumber");
        String identityCardNumber = body.get("identityCardNumber");
        String apartmentNumber = body.get("apartmentNumber");
        String role = body.getOrDefault("role", "USER").trim().toUpperCase();

        // Validate required fields
        if (phoneNumber == null || phoneNumber.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Phone number is required"));
        }
        if (identityCardNumber == null || identityCardNumber.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Identity card number (CCCD) is required"));
        }

        // Check if phone number (username) already taken
        if (userRepository.findByUsername(phoneNumber).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Phone number already registered"));
        }

        // Check if CCCD already taken
        if (userRepository.findByIdentityCardNumber(identityCardNumber).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "CCCD already registered"));
        }

        User user = new User();
        user.setUsername(phoneNumber);          // username = phone number
        user.setPassword(passwordEncoder.encode(identityCardNumber)); // password = BCrypt(CCCD)
        user.setPhoneNumber(phoneNumber);
        user.setIdentityCardNumber(identityCardNumber);
        user.setRole(role);

        // Only link apartment for USER role
        if ("USER".equals(role)) {
            if (apartmentNumber == null || apartmentNumber.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Apartment number is required for residents"));
            }
            Apartment apartment = apartmentRepository.findByApartmentNumber(apartmentNumber)
                    .orElse(null);
            if (apartment == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Apartment " + apartmentNumber + " not found"));
            }
            user.setApartment(apartment);
        }
        // ADMIN accounts: no apartment attached

        User savedUser = userRepository.save(user);
        return ResponseEntity.ok(savedUser);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> loginData) {
        String username = loginData.get("username");
        String password = loginData.get("password");

        return userRepository.findByUsername(username)
                .filter(user -> passwordEncoder.matches(password, user.getPassword()))
                .map(user -> {
                    String token = jwtUtil.generateToken(user.getUsername(), user.getRole());
                    Map<String, Object> response = new HashMap<>();
                    response.put("token", token);
                    response.put("id", user.getId());
                    response.put("username", user.getUsername());
                    response.put("role", user.getRole());
                    response.put("fullName", user.getFullName());
                    response.put("apartmentNumber", user.getApartmentNumber());
                    return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.status(401).body(
                    Map.of("error", "Invalid username or password")
                ));
    }
}
