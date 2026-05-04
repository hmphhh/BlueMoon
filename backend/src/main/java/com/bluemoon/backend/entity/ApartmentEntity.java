package com.bluemoon.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "apartments")
@Data
@NoArgsConstructor
public class ApartmentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String apartmentNumber; // e.g. "101", "602"

    public ApartmentEntity(String apartmentNumber) {
        this.apartmentNumber = apartmentNumber;
    }
}
