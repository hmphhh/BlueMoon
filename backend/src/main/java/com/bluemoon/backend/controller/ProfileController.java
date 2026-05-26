package com.bluemoon.backend.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bluemoon.backend.dtos.request.ChangePasswordRequest;
import com.bluemoon.backend.dtos.request.UpdateProfileRequest;
import com.bluemoon.backend.dtos.request.VerifyOtpRequest;
import com.bluemoon.backend.dtos.response.ProfileResponse;
import com.bluemoon.backend.mapper.UserMapper;
import com.bluemoon.backend.mapper.ResidentMapper;
import com.bluemoon.backend.service.UserService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/me")
public class ProfileController {

    @Autowired
    private UserService userService;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private ResidentMapper residentMapper;

    /**
     * Get the currently logged-in user's profile with resident information.
     */
    @GetMapping
    public ResponseEntity<ProfileResponse> getMyProfile() {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        var user = userService.getUserByUsername(currentUsername);
        
        ProfileResponse response = userMapper.toProfileResponse(user);
        
        if (user.getResident() != null) {
            ProfileResponse.ResidentProfileDto residentDto = new ProfileResponse.ResidentProfileDto();
            residentDto.setId(user.getResident().getId());
            residentDto.setFullName(user.getResident().getFullName());
            residentDto.setIdNumber(user.getResident().getIdNumber());
            residentDto.setDateOfBirth(user.getResident().getDateOfBirth().toString());
            residentDto.setGender(user.getResident().getGender().toString());
            residentDto.setPhone(user.getResident().getPhone());
            residentDto.setRelationship(user.getResident().getRelationship().toString());
            residentDto.setStatus(user.getResident().getStatus().toString());
            
            if (user.getResident().getApartment() != null) {
                ProfileResponse.ApartmentSimplifiedDto apartmentDto = new ProfileResponse.ApartmentSimplifiedDto();
                apartmentDto.setId(user.getResident().getApartment().getId());
                apartmentDto.setApartmentNumber(user.getResident().getApartment().getApartmentNumber());
                residentDto.setApartment(apartmentDto);
            }
            
            response.setResident(residentDto);
        }
        
        return ResponseEntity.ok(response);
    }

    /**
     * Update the currently logged-in user's profile.
     */
    @PutMapping
    public ResponseEntity<ProfileResponse> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        var updatedUser = userService.updateProfile(currentUsername, request);
        
        ProfileResponse response = userMapper.toProfileResponse(updatedUser);
        
        if (updatedUser.getResident() != null) {
            ProfileResponse.ResidentProfileDto residentDto = new ProfileResponse.ResidentProfileDto();
            residentDto.setId(updatedUser.getResident().getId());
            residentDto.setFullName(updatedUser.getResident().getFullName());
            residentDto.setIdNumber(updatedUser.getResident().getIdNumber());
            residentDto.setDateOfBirth(updatedUser.getResident().getDateOfBirth().toString());
            residentDto.setGender(updatedUser.getResident().getGender().toString());
            residentDto.setPhone(updatedUser.getResident().getPhone());
            residentDto.setRelationship(updatedUser.getResident().getRelationship().toString());
            residentDto.setStatus(updatedUser.getResident().getStatus().toString());
            
            if (updatedUser.getResident().getApartment() != null) {
                ProfileResponse.ApartmentSimplifiedDto apartmentDto = new ProfileResponse.ApartmentSimplifiedDto();
                apartmentDto.setId(updatedUser.getResident().getApartment().getId());
                apartmentDto.setApartmentNumber(updatedUser.getResident().getApartment().getApartmentNumber());
                residentDto.setApartment(apartmentDto);
            }
            
            response.setResident(residentDto);
        }
        
        return ResponseEntity.ok(response);
    }

    /**
     * Send a 6-digit OTP to the logged-in user's email.
     */
    @PostMapping("/send-verification")
    public ResponseEntity<?> sendVerification() {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        userService.sendVerificationOtp(currentUsername);
        return ResponseEntity.ok(Map.of("message", "Verification code sent successfully"));
    }

    /**
     * Verify email with a 6-digit OTP code.
     */
    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        userService.verifyOtp(currentUsername, request.getOtp());
        return ResponseEntity.ok(Map.of("message", "Email verified successfully"));
    }

    /**
     * Resend a new 6-digit OTP code.
     */
    @PostMapping("/resend-otp")
    public ResponseEntity<?> resendOtp() {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        userService.sendVerificationOtp(currentUsername);
        return ResponseEntity.ok(Map.of("message", "A new verification code has been sent"));
    }

    /**
     * Change password for the currently logged-in user.
     */
    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        var updatedUser = userService.changePassword(currentUsername, request);
        
        ProfileResponse response = userMapper.toProfileResponse(updatedUser);
        
        if (updatedUser.getResident() != null) {
            ProfileResponse.ResidentProfileDto residentDto = new ProfileResponse.ResidentProfileDto();
            residentDto.setId(updatedUser.getResident().getId());
            residentDto.setFullName(updatedUser.getResident().getFullName());
            residentDto.setIdNumber(updatedUser.getResident().getIdNumber());
            residentDto.setDateOfBirth(updatedUser.getResident().getDateOfBirth().toString());
            residentDto.setGender(updatedUser.getResident().getGender().toString());
            residentDto.setPhone(updatedUser.getResident().getPhone());
            residentDto.setRelationship(updatedUser.getResident().getRelationship().toString());
            residentDto.setStatus(updatedUser.getResident().getStatus().toString());
            
            if (updatedUser.getResident().getApartment() != null) {
                ProfileResponse.ApartmentSimplifiedDto apartmentDto = new ProfileResponse.ApartmentSimplifiedDto();
                apartmentDto.setId(updatedUser.getResident().getApartment().getId());
                apartmentDto.setApartmentNumber(updatedUser.getResident().getApartment().getApartmentNumber());
                residentDto.setApartment(apartmentDto);
            }
            
            response.setResident(residentDto);
        }
        
        return ResponseEntity.ok(Map.of(
            "message", "Password changed successfully",
            "user", response
        ));
    }
}
