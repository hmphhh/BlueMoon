package com.bluemoon.backend.repository;

import com.bluemoon.backend.entity.Apartment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ApartmentRepository extends JpaRepository<Apartment, Long> {

    Optional<Apartment> findByApartmentNumber(String apartmentNumber);
}
