package com.bluemoon.backend.entity;

import com.bluemoon.backend.enums.ApartmentStatus;
import com.bluemoon.backend.enums.ApartmentType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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

    @Column(unique = true, nullable = false, length = 10)
    private String apartmentNumber;

    @Column(nullable = false)
    private Integer floor;

    @Column(nullable = false)
    private Double area;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private ApartmentStatus status = ApartmentStatus.VACANT;

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private ApartmentType type;

    public ApartmentEntity(String apartmentNumber) {
        this.apartmentNumber = apartmentNumber;
    }
}
