package com.bluemoon.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.bluemoon.backend.entity.BillEntity;

public interface BillRepository extends JpaRepository<BillEntity, Long> {

    List<BillEntity> findByApartment_ApartmentNumberOrderByCreatedAtDesc(String apartmentNumber);

    List<BillEntity> findAllByOrderByCreatedAtDesc();
}
