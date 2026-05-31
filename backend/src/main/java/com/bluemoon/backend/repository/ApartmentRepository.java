package com.bluemoon.backend.repository;

import com.bluemoon.backend.dtos.response.ApartmentResponse;
import com.bluemoon.backend.entity.ApartmentEntity;
import com.bluemoon.backend.enums.ResidentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ApartmentRepository extends JpaRepository<ApartmentEntity, Long> {

    Optional<ApartmentEntity> findByApartmentNumber(String apartmentNumber);

    /**
     * Count the number of active users assigned to an apartment (excludes MOVED_OUT).
     */
    @Query("SELECT COUNT(u) FROM UserEntity u WHERE u.apartment.id = :apartmentId AND (u.status IS NULL OR u.status <> :excludedStatus)")
    Long countActiveUsersByApartmentId(@Param("apartmentId") Long apartmentId, @Param("excludedStatus") ResidentStatus excludedStatus);

    /**
     * Count ALL users assigned to an apartment (including MOVED_OUT, for deletion guard).
     */
    @Query("SELECT COUNT(u) FROM UserEntity u WHERE u.apartment.id = :apartmentId")
    Long countUsersByApartmentId(@Param("apartmentId") Long apartmentId);

    /**
     * Get all apartments with user count using JPQL to avoid N+1 queries.
     */
    @Query("""
        SELECT new com.bluemoon.backend.dtos.response.ApartmentResponse(
            a.id,
            a.apartmentNumber,
            a.floor,
            a.area,
            a.status,
            a.type,
            COUNT(CASE WHEN u.status IS NULL OR u.status <> 'MOVED_OUT' THEN u.id END)
        )
        FROM ApartmentEntity a
        LEFT JOIN a.users u
        GROUP BY a.id, a.apartmentNumber, a.floor, a.area, a.status, a.type
    """)
    List<ApartmentResponse> findAllWithUserCount();
}
