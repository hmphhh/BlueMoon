package com.bluemoon.backend.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.bluemoon.backend.dtos.request.UserRequest;
import com.bluemoon.backend.dtos.request.ChangePasswordRequest;
import com.bluemoon.backend.dtos.request.UpdateProfileRequest;
import com.bluemoon.backend.enums.OtpTokenType;
import com.bluemoon.backend.enums.ResidentRelationship;
import com.bluemoon.backend.enums.ResidentStatus;
import com.bluemoon.backend.enums.UserRole;
import com.bluemoon.backend.entity.ApartmentEntity;
import com.bluemoon.backend.entity.OtpVerificationToken;
import com.bluemoon.backend.entity.UserEntity;
import com.bluemoon.backend.entity.ResidentEntity;
import com.bluemoon.backend.exceptions.InvalidCredentialsException;
import com.bluemoon.backend.exceptions.InvalidOperationException;
import com.bluemoon.backend.exceptions.ResourceNotFoundException;
import com.bluemoon.backend.repository.ApartmentRepository;
import com.bluemoon.backend.repository.UserRepository;
import com.bluemoon.backend.repository.ResidentRepository;



@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ResidentRepository residentRepository;

    @Autowired
    private ApartmentRepository apartmentRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private OtpService otpService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    /**
     * Get all users (admin only).
     */
    public List<UserEntity> getAllUsers() {
        return userRepository.findAll();
    }

    /**
     * Create a new user with integrated account + resident data.
     * Password is auto-set to BCrypt(identityCardNumber/CCCD).
     * For USER role, a ResidentEntity is created and linked 1:1.
     * For ADMIN role, no resident is created.
     */
    @Transactional
    public UserEntity createUser(UserRequest request) {
        // Validate uniqueness
        if (userRepository.findByPhoneNumber(request.getPhoneNumber()).isPresent()) {
            throw new InvalidOperationException("Phone number already registered");
        }
        if (userRepository.findByIdentityCardNumber(request.getIdentityCardNumber()).isPresent()) {
            throw new InvalidOperationException("Identity card number (CCCD) already registered");
        }
        // Also check username uniqueness (username = phoneNumber)
        if (userRepository.findByUsername(request.getPhoneNumber()).isPresent()) {
            throw new InvalidOperationException("Phone number already registered as username");
        }

        // Create user entity
        UserEntity user = new UserEntity();
        user.setUsername(request.getPhoneNumber());             // login username = phone number
        user.setPhoneNumber(request.getPhoneNumber());
        user.setIdentityCardNumber(request.getIdentityCardNumber());
        user.setPassword(passwordEncoder.encode(request.getIdentityCardNumber())); // password = BCrypt(CCCD)
        user.setRole(request.getRole() != null ? request.getRole() : UserRole.USER);
        user.setVerified(false);

        // For USER role, create and link a resident
        if (user.getRole() == UserRole.USER) {
            if (request.getApartmentId() == null) {
                throw new InvalidOperationException("Apartment is required for resident accounts");
            }

            ApartmentEntity apartment = apartmentRepository.findById(request.getApartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Apartment not found with id: " + request.getApartmentId()));

            // Check idNumber uniqueness in residents table
            if (residentRepository.findByIdNumber(request.getIdentityCardNumber()).isPresent()) {
                throw new InvalidOperationException("A resident with this ID number already exists");
            }

            ResidentEntity resident = new ResidentEntity();
            resident.setFullName(request.getFullName());
            resident.setPhone(request.getPhoneNumber());                // same phone as user
            resident.setIdNumber(request.getIdentityCardNumber());      // same CCCD as user
            resident.setDateOfBirth(request.getDateOfBirth());
            resident.setGender(request.getGender());
            resident.setRelationship(request.getRelationship() != null ? request.getRelationship() : ResidentRelationship.OWNER);
            resident.setStatus(ResidentStatus.ACTIVE);
            resident.setApartment(apartment);

            resident = residentRepository.save(resident);
            user.setResident(resident);
        }
        // ADMIN role: no resident created

        return userRepository.save(user);
    }

    /**
     * Link a user to an existing resident (1-1 relationship).
     * Prevents duplicate links:
     * - A user cannot be linked to multiple residents
     * - A resident cannot be linked to multiple users
     * Throws ResourceNotFoundException if either user or resident not found.
     * Throws InvalidOperationException if resident is already linked.
     */
    @Transactional
    public UserEntity linkToResident(Long userId, Long residentId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (user.getRole() == UserRole.ADMIN) {
            throw new InvalidOperationException("Admin users cannot be linked to residents");
        }

        ResidentEntity resident = residentRepository.findById(residentId)
                .orElseThrow(() -> new ResourceNotFoundException("Resident not found with id: " + residentId));

        if (userRepository.findByResidentId(residentId).isPresent()) {
            throw new InvalidOperationException("Resident is already linked to another user");
        }

        user.setResident(resident);
        return userRepository.save(user);
    }

    /**
     * Unlink a user from their resident.
     * Throws ResourceNotFoundException if user not found.
     * Throws InvalidOperationException if user is not linked to any resident.
     */
    @Transactional
    public UserEntity unlinkFromResident(Long userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (user.getResident() == null) {
            throw new InvalidOperationException("User is not linked to any resident");
        }

        user.setResident(null);
        return userRepository.save(user);
    }

    /**
     * Get a user by their username.
     * Throws ResourceNotFoundException if user not found.
     */
    public UserEntity getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
    }

    /**
     * Get a user by their ID.
     * Throws ResourceNotFoundException if user not found.
     */
    public UserEntity getUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
    }

    /**
     * Update profile — only allows: email and resident fields.
     * Returns the updated user entity.
     * Throws ResourceNotFoundException if user not found.
     * Throws InvalidOperationException if email is already taken by another user.
     * Sets isVerified=false if email is changed.
     */
    @Transactional
    public UserEntity updateProfile(String username, UpdateProfileRequest request) {
        UserEntity user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        String oldEmail = user.getEmail();

        if (request.getEmail() != null) {
            // Check if new email is already taken by another user
            if (!request.getEmail().equals(oldEmail)) {
                if (userRepository.findByEmail(request.getEmail()).isPresent()) {
                    throw new InvalidOperationException("Email is already in use");
                }
            }
            user.setEmail(request.getEmail());
        }
        
        // Update resident information if provided
        if (request.getResident() != null && user.getResident() != null) {
            ResidentEntity resident = user.getResident();
            if (request.getResident().getFullName() != null) {
                resident.setFullName(request.getResident().getFullName());
            }
            if (request.getResident().getDateOfBirth() != null) {
                resident.setDateOfBirth(request.getResident().getDateOfBirth());
            }
            if (request.getResident().getPhone() != null) {
                resident.setPhone(request.getResident().getPhone());
            }
            if (request.getResident().getGender() != null) {
                resident.setGender(request.getResident().getGender());
            }
            residentRepository.save(resident);
        }

        boolean emailChanged = request.getEmail() != null && !request.getEmail().equals(oldEmail);
        if (emailChanged) {
            user.setVerified(false);
            otpService.getAndDeleteOtp(user, OtpTokenType.EMAIL_VERIFICATION); // Clear any existing OTP for email verification
        }

        return userRepository.save(user);
    }

    /**
     * Generate a 6-digit OTP and send it to the user's email.
     * Throws ResourceNotFoundException if user not found.
     * Throws InvalidOperationException if email not set or already verified.
     */
    @Transactional
    public void sendVerificationOtp(String username) {
        UserEntity user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        if (user.getEmail() == null || user.getEmail().isBlank()) {
            throw new InvalidOperationException("No email set for this user");
        }
        if (user.isVerified()) {
            throw new InvalidOperationException("Email already verified");
        }

        // Create and save OTP token
        OtpVerificationToken otpToken = otpService.createAndSaveOtp(user, OtpTokenType.EMAIL_VERIFICATION);
        
        // Send OTP email for email verification
        emailService.sendOtpEmail(user.getEmail(), otpToken.getOtp());
    }

    /**
     * Verify email with OTP code.
     * Checks that the OTP matches and has not expired.
     * Throws InvalidOperationException if OTP is invalid or expired.
     */
    @Transactional
    public void verifyOtp(String username, String otp) {
        UserEntity user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        if (user.isVerified()) {
            throw new InvalidOperationException("Email already verified");
        }

        // Verify OTP using OtpService (deletes if invalid/expired)
        if (!otpService.verifyOtp(user, OtpTokenType.EMAIL_VERIFICATION, otp)) {
            throw new InvalidOperationException("Invalid or expired OTP");
        }

        // Delete the OTP after successful verification
        otpService.getAndDeleteOtp(user, OtpTokenType.EMAIL_VERIFICATION);

        // Mark user as verified
        user.setVerified(true);
        userRepository.save(user);
    }

    /**
     * Delete a user by ID.
     * Throws ResourceNotFoundException if user not found.
     * Cascade delete will remove related OTP and password reset tokens.
     */
    @Transactional
    public void deleteUser(Long id) {
        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        userRepository.delete(user);
    }

    /**
     * Change password for the authenticated user.
     * Verifies the current password before allowing the change.
     * Returns the updated user entity.
     * Throws ResourceNotFoundException if user not found.
     * Throws InvalidCredentialsException if current password is incorrect.
     * Throws InvalidOperationException if new passwords don't match.
     */
    @Transactional
    public UserEntity changePassword(String username, ChangePasswordRequest request) {
        UserEntity user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        // Verify current password
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new InvalidOperationException("Current password is incorrect");
        }

        // Check if new passwords match
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new InvalidOperationException("New password and confirm password do not match");
        }

        // Check if new password is same as current password
        if (request.getCurrentPassword().equals(request.getNewPassword())) {
            throw new InvalidOperationException("New password must be different from current password");
        }

        // Update password
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        return userRepository.save(user);
    }
}
