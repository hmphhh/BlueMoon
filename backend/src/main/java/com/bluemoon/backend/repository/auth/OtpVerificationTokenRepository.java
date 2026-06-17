package com.bluemoon.backend.repository.auth;

import com.bluemoon.backend.entity.auth.OtpVerificationToken;
import com.bluemoon.backend.enums.auth.OtpTokenType;
import com.bluemoon.backend.entity.auth.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface OtpVerificationTokenRepository extends JpaRepository<OtpVerificationToken, Long> {

    Optional<OtpVerificationToken> findByUserAndTokenType(UserEntity user, OtpTokenType tokenType);

    List<OtpVerificationToken> findByUser(UserEntity user);

    void deleteByUserAndTokenType(UserEntity user, OtpTokenType tokenType);
}
