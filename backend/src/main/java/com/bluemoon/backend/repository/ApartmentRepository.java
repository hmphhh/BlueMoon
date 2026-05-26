package com.bluemoon.backend.repository;

import com.bluemoon.backend.entity.ApartmentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface ApartmentRepository extends JpaRepository<ApartmentEntity, Long> {

    Optional<ApartmentEntity> findByApartmentNumber(String apartmentNumber);

    /**
     * Count the number of residents in an apartment using JPQL to avoid N+1 queries.
     */
    @Query("SELECT COUNT(r) FROM ResidentEntity r WHERE r.apartment.id = :apartmentId")
    Long countResidentsByApartmentId(@Param("apartmentId") Long apartmentId);
}
