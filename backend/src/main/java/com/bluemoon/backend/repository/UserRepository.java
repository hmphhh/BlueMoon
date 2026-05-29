package com.bluemoon.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.bluemoon.backend.entity.UserEntity;

public interface UserRepository extends JpaRepository<UserEntity, Long> {

    Optional<UserEntity> findByUsername(String username);

    Optional<UserEntity> findByEmail(String email);

    Optional<UserEntity> findByPhoneNumber(String phoneNumber);

    Optional<UserEntity> findByIdentityCardNumber(String identityCardNumber);

    /**
     * Find a user by resident ID (1-1 relationship check).
     */
    Optional<UserEntity> findByResidentId(Long residentId);
}

