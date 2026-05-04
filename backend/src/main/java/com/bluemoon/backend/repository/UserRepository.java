package com.bluemoon.backend.repository;

import com.bluemoon.backend.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<UserEntity, Long> {

    Optional<UserEntity> findByUsername(String username);

    Optional<UserEntity> findByVerificationToken(String verificationToken);

    Optional<UserEntity> findByIdentityCardNumber(String identityCardNumber);
}
