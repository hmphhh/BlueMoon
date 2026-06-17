package com.bluemoon.backend.service.auth;
import com.bluemoon.backend.service.apartment.ApartmentService;


import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.bluemoon.backend.dtos.request.auth.ChangePasswordRequest;
import com.bluemoon.backend.dtos.request.auth.CreateUserRequest;
import com.bluemoon.backend.dtos.request.auth.ResetUserPasswordRequest;
import com.bluemoon.backend.dtos.request.auth.UpdateProfileRequest;
import com.bluemoon.backend.dtos.request.auth.UpdateUserRequest;
import com.bluemoon.backend.entity.apartment.ApartmentEntity;
import com.bluemoon.backend.entity.auth.OtpVerificationToken;
import com.bluemoon.backend.entity.auth.UserEntity;
import com.bluemoon.backend.enums.auth.OtpTokenType;
import com.bluemoon.backend.enums.apartment.ResidentRelationship;
import com.bluemoon.backend.enums.apartment.ResidentStatus;
import com.bluemoon.backend.enums.auth.UserRole;
import com.bluemoon.backend.exceptions.InvalidOperationException;
import com.bluemoon.backend.exceptions.ResourceNotFoundException;
import com.bluemoon.backend.repository.apartment.ApartmentRepository;
import com.bluemoon.backend.repository.auth.UserRepository;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ApartmentRepository apartmentRepository;

    @Autowired
    private ApartmentService apartmentService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private OtpService otpService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // ─── Admin: Get All Users (paginated, search, filter) ───

    public Map<String, Object> getAllUsers(int page, int size, String search, String role, String status, Long apartmentId) {
        Pageable pageable = PageRequest.of(page, size);

        UserRole roleEnum = null;
        if (role != null && !role.isEmpty()) {
            try { roleEnum = UserRole.valueOf(role); } catch (Exception ignored) {}
        }

        ResidentStatus statusEnum = null;
        if (status != null && !status.isEmpty()) {
            try { statusEnum = ResidentStatus.valueOf(status); } catch (Exception ignored) {}
        }

        Page<UserEntity> userPage = userRepository.searchUsers(search, roleEnum, statusEnum, apartmentId, pageable);

        Map<String, Object> response = new HashMap<>();
        response.put("content", userPage.getContent());
        response.put("page", userPage.getNumber());
        response.put("size", userPage.getSize());
        response.put("totalElements", userPage.getTotalElements());
        response.put("totalPages", userPage.getTotalPages());
        return response;
    }

    // ─── Admin: Get User By ID ───

    public UserEntity getUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
    }

    // ─── Admin: Create User ───

    @Transactional
    public UserEntity createUser(CreateUserRequest request) {
        // Phone number is used as the login username
        String username = request.getPhone();

        // Validate phone/username uniqueness
        if (userRepository.findByUsername(username).isPresent()) {
            throw new InvalidOperationException("Phone number already exists as an account");
        }

        // Validate idNumber uniqueness
        if (userRepository.findByIdNumber(request.getIdNumber()).isPresent()) {
            throw new InvalidOperationException("ID number already exists");
        }

        UserEntity user = new UserEntity();
        user.setUsername(username); // phone → username (login account)
        user.setPassword(passwordEncoder.encode(request.getIdNumber())); // CCCD → encrypted password
        user.setEmail(null); // email is not provided at creation; user sets it later
        user.setRole(request.getRole());
        user.setVerified(false);

        // Set personal information fields (always populated)
        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());
        user.setDateOfBirth(request.getDateOfBirth());
        user.setGender(request.getGender());
        user.setIdNumber(request.getIdNumber());

        if (request.getRole() == UserRole.USER) {
            // Validate apartment for USER role
            if (request.getApartmentId() == null) {
                throw new InvalidOperationException("Apartment is required for USER role");
            }

            ApartmentEntity apartment = apartmentRepository.findById(request.getApartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Apartment not found with id: " + request.getApartmentId()));

            user.setRelationship(request.getRelationship() != null ? request.getRelationship() : ResidentRelationship.OTHER);
            user.setStatus(ResidentStatus.ACTIVE);
            user.setApartment(apartment);
        }
        // ADMIN role: no resident-specific fields (relationship, apartment) set

        user = userRepository.save(user);

        // Auto-update apartment status
        if (user.getApartment() != null) {
            apartmentService.updateApartmentStatusByUserCount(user.getApartment().getId());
        }

        return user;
    }

    // ─── Admin: Update User ───

    @Transactional
    public UserEntity updateUser(Long userId, UpdateUserRequest request) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        String oldEmail = user.getEmail();
        Long oldApartmentId = user.getApartment() != null ? user.getApartment().getId() : null;
        ResidentStatus oldStatus = user.getStatus();

        // Update email
        if (request.getEmail() != null) {
            if (!request.getEmail().equals(oldEmail)) {
                if (userRepository.findByEmail(request.getEmail()).isPresent()) {
                    throw new InvalidOperationException("Email already in use");
                }
                user.setEmail(request.getEmail());
                user.setVerified(false); // Reset verification on email change
            }
        }

        // Update resident fields
        if (request.getFullName() != null) user.setFullName(request.getFullName());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getDateOfBirth() != null) user.setDateOfBirth(request.getDateOfBirth());
        if (request.getGender() != null) user.setGender(request.getGender());
        if (request.getRelationship() != null) user.setRelationship(request.getRelationship());
        if (request.getStatus() != null) user.setStatus(request.getStatus());

        // Update apartment
        if (request.getApartmentId() != null) {
            ApartmentEntity apartment = apartmentRepository.findById(request.getApartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Apartment not found with id: " + request.getApartmentId()));
            user.setApartment(apartment);
        }

        user = userRepository.save(user);

        // Determine if apartment or status changed
        Long newApartmentId = user.getApartment() != null ? user.getApartment().getId() : null;
        ResidentStatus newStatus = user.getStatus();
        boolean apartmentChanged = (oldApartmentId != null && !oldApartmentId.equals(newApartmentId))
                || (newApartmentId != null && !newApartmentId.equals(oldApartmentId));
        boolean statusChanged = oldStatus != newStatus;

        // If apartment changed, update both old and new apartment statuses
        if (apartmentChanged) {
            if (oldApartmentId != null) {
                apartmentService.updateApartmentStatusByUserCount(oldApartmentId);
            }
            if (newApartmentId != null) {
                apartmentService.updateApartmentStatusByUserCount(newApartmentId);
            }
        } else if (statusChanged && newApartmentId != null) {
            // Apartment didn't change, but status did — recalculate if status involves MOVED_OUT
            boolean involvesMoveOut = oldStatus == ResidentStatus.MOVED_OUT || newStatus == ResidentStatus.MOVED_OUT;
            if (involvesMoveOut) {
                apartmentService.updateApartmentStatusByUserCount(newApartmentId);
            }
        }

        return user;
    }

    // ─── Admin: Delete User ───

    @Transactional
    public void deleteUser(Long userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        Long apartmentId = user.getApartment() != null ? user.getApartment().getId() : null;

        userRepository.delete(user);

        // Auto-update apartment status
        if (apartmentId != null) {
            apartmentService.updateApartmentStatusByUserCount(apartmentId);
        }
    }

    // ─── Admin: Reset Password ───

    @Transactional
    public void resetPassword(Long userId, ResetUserPasswordRequest request) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        user.setPassword(passwordEncoder.encode(request.getPassword()));
        userRepository.save(user);
    }

    // ─── Current User: Get Profile ───

    public UserEntity getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
    }

    // ─── Current User: Update Profile ───

    @Transactional
    public UserEntity updateProfile(String username, UpdateProfileRequest request) {
        UserEntity user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        String oldEmail = user.getEmail();

        // Update email
        if (request.getEmail() != null) {
            if (!request.getEmail().equals(oldEmail)) {
                if (userRepository.findByEmail(request.getEmail()).isPresent()) {
                    throw new InvalidOperationException("Email already in use");
                }
                user.setEmail(request.getEmail());
            }
        }

        // Update editable resident fields
        if (request.getFullName() != null) user.setFullName(request.getFullName());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getDateOfBirth() != null) user.setDateOfBirth(request.getDateOfBirth());
        if (request.getGender() != null) user.setGender(request.getGender());
        if (request.getRelationship() != null) user.setRelationship(request.getRelationship());

        // Reset verified if email changed
        boolean emailChanged = request.getEmail() != null && !request.getEmail().equals(oldEmail);
        if (emailChanged) {
            user.setVerified(false);
            otpService.getAndDeleteOtp(user, OtpTokenType.EMAIL_VERIFICATION);
        }

        return userRepository.save(user);
    }

    // ─── Current User: Change Password ───

    @Transactional
    public UserEntity changePassword(String username, ChangePasswordRequest request) {
        UserEntity user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new InvalidOperationException("Current password is incorrect");
        }

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new InvalidOperationException("New password and confirm password do not match");
        }

        if (request.getCurrentPassword().equals(request.getNewPassword())) {
            throw new InvalidOperationException("New password must be different from current password");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        return userRepository.save(user);
    }

    // ─── Email Verification ───

    @Transactional
    public void sendVerificationOtp(String username) {
        UserEntity user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        if (user.getEmail() == null || user.getEmail().isBlank()) {
            throw new InvalidOperationException("No email set for this user");
        }
        if (user.getVerified()) {
            throw new InvalidOperationException("Email already verified");
        }

        OtpVerificationToken otpToken = otpService.createAndSaveOtp(user, OtpTokenType.EMAIL_VERIFICATION);
        emailService.sendOtpEmail(user.getEmail(), otpToken.getOtp());
    }

    @Transactional
    public void verifyOtp(String username, String otp) {
        UserEntity user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        if (user.getVerified()) {
            throw new InvalidOperationException("Email already verified");
        }

        if (!otpService.verifyOtp(user, OtpTokenType.EMAIL_VERIFICATION, otp)) {
            throw new InvalidOperationException("Invalid or expired OTP");
        }

        otpService.getAndDeleteOtp(user, OtpTokenType.EMAIL_VERIFICATION);

        user.setVerified(true);
        userRepository.save(user);
    }
}
