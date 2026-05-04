package com.bluemoon.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.bluemoon.backend.controller.request.LoginRequest;
import com.bluemoon.backend.controller.request.RegisterRequest;
import com.bluemoon.backend.controller.response.ErrorResponse;
import com.bluemoon.backend.controller.response.LoginResponse;
import com.bluemoon.backend.controller.response.ResponseMapper;
import com.bluemoon.backend.controller.response.UserResponse;
import com.bluemoon.backend.service.AuthService;
import com.bluemoon.backend.service.dto.UserDTO;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    /**
     * Admin registers a new account.
     * Body: { phoneNumber, identityCardNumber, apartmentNumber (optional for ADMIN), role (optional, default USER) }
     * Logic: username = phoneNumber, password = BCrypt(identityCardNumber)
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            UserDTO userDTO = authService.register(request);
            UserResponse response = ResponseMapper.toUserResponse(userDTO);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request.getUsername(), request.getPassword());
        if (response == null) {
            return ResponseEntity.status(401).body(
                new ErrorResponse("Invalid username or password")
            );
        }
        return ResponseEntity.ok(response);
    }
}
