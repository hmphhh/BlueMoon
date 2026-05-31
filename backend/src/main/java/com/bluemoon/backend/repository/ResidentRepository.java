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
     * Legacy: User-Resident link no longer exists in the merged model.
     * Returns empty since UserEntity no longer has a 'resident' field.
     */
    default Optional<UserEntity> findLinkedUser(@Param("residentId") Long residentId) {
        return Optional.empty();
    }

    /**
     * Get apartment number for a resident using JPQL.
     */
    @Query("SELECT a.apartmentNumber FROM ApartmentEntity a WHERE a.id = (SELECT r.apartment.id FROM ResidentEntity r WHERE r.id = :residentId)")
    Optional<String> getApartmentNumber(@Param("residentId") Long residentId);
}
