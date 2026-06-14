package com.bluemoon.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.bluemoon.backend.entity.UserEntity;
import com.bluemoon.backend.enums.ResidentStatus;
import com.bluemoon.backend.enums.UserRole;

public interface UserRepository extends JpaRepository<UserEntity, Long> {

    Optional<UserEntity> findByUsername(String username);

    Optional<UserEntity> findByEmail(String email);

    Optional<UserEntity> findByIdNumber(String idNumber);

    Optional<UserEntity> findByPhone(String phone);

    List<UserEntity> findByApartmentId(Long apartmentId);

    List<UserEntity> findByRole(UserRole role);

    /**
     * Paginated search and filter for admin user list.
     * Searches across username, fullName, email, phone, idNumber.
     * Filters by role, status, apartmentId.
     */
    @Query("""
        SELECT u FROM UserEntity u
        WHERE (:search IS NULL OR :search = ''
            OR LOWER(u.username) LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(u.phone) LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(u.idNumber) LIKE LOWER(CONCAT('%', :search, '%'))
        )
        AND (:role IS NULL OR u.role = :role)
        AND (:status IS NULL OR u.status = :status)
        AND (:apartmentId IS NULL OR u.apartment.id = :apartmentId)
    """)
    Page<UserEntity> searchUsers(
        @Param("search") String search,
        @Param("role") UserRole role,
        @Param("status") ResidentStatus status,
        @Param("apartmentId") Long apartmentId,
        Pageable pageable
    );
}
