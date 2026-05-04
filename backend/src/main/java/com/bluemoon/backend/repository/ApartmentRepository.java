package com.bluemoon.backend.repository;

import com.bluemoon.backend.entity.ApartmentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ApartmentRepository extends JpaRepository<ApartmentEntity, Long> {

    Optional<ApartmentEntity> findByApartmentNumber(String apartmentNumber);
}
