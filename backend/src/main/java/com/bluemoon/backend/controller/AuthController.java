package com.bluemoon.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.bluemoon.backend.dtos.request.LoginRequest;
import com.bluemoon.backend.dtos.request.RegisterRequest;
import com.bluemoon.backend.dtos.response.LoginResponse;
import com.bluemoon.backend.dtos.response.UserResponse;
import com.bluemoon.backend.mapper.UserMapper;
import com.bluemoon.backend.service.AuthService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserMapper userMapper;

    /**
     * Admin registers a new account.
     * Body: { phoneNumber, identityCardNumber, apartmentNumber (optional for ADMIN), role (optional, default USER) }
     * Logic: username = phoneNumber, password = BCrypt(identityCardNumber)
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
        var userEntity = authService.register(request);
        UserResponse response = userMapper.toResponse(userEntity);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request.getUsername(), request.getPassword());
        return ResponseEntity.ok(response);
    }
}
