package com.bluemoon.backend.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.bluemoon.backend.service.AuthService;

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
    public ResponseEntity<?> register(@RequestBody Map<String, String> body) {
        Map<String, Object> result = authService.register(body);
        if (result.containsKey("error")) {
            return ResponseEntity.badRequest().body(Map.of("error", result.get("error")));
        }
        return ResponseEntity.ok(result.get("user"));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> loginData) {
        String username = loginData.get("username");
        String password = loginData.get("password");

        Map<String, Object> response = authService.login(username, password);
        if (response == null) {
            return ResponseEntity.status(401).body(
                Map.of("error", "Invalid username or password")
            );
        }
        return ResponseEntity.ok(response);
    }
}
