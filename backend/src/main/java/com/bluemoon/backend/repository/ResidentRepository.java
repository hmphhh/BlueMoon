package com.bluemoon.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.bluemoon.backend.entity.ResidentEntity;
import com.bluemoon.backend.entity.UserEntity;

public interface ResidentRepository extends JpaRepository<ResidentEntity, Long> {

    Optional<ResidentEntity> findByIdNumber(String idNumber);

    Optional<ResidentEntity> findByPhone(String phone);

    List<ResidentEntity> findByApartmentId(Long apartmentId);

    /**
     * Find the user linked to a resident (1-1 relationship).
     * Uses JPQL to avoid N+1 queries.
     */
    @Query("SELECT u FROM UserEntity u WHERE u.resident.id = :residentId")
    Optional<UserEntity> findLinkedUser(@Param("residentId") Long residentId);

    /**
     * Get apartment number for a resident using JPQL.
     */
    @Query("SELECT a.apartmentNumber FROM ApartmentEntity a WHERE a.id = (SELECT r.apartment.id FROM ResidentEntity r WHERE r.id = :residentId)")
    Optional<String> getApartmentNumber(@Param("residentId") Long residentId);
}
