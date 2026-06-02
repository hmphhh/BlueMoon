package com.bluemoon.backend.entity;

import java.time.LocalDate;

import com.bluemoon.backend.enums.Gender;
import com.bluemoon.backend.enums.ResidentRelationship;
import com.bluemoon.backend.enums.ResidentStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "residents")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResidentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String fullName;

    @Column(nullable = false, length = 15)
    private String phone;

    @Column(nullable = false)
    private LocalDate dateOfBirth;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private Gender gender;

    @Column(unique = true, nullable = false, length = 20)
    private String idNumber;

    @Column(nullable = false, length = 50, columnDefinition = "VARCHAR(50) DEFAULT 'OWNER'")
    @Enumerated(EnumType.STRING)
    private ResidentRelationship relationship = ResidentRelationship.OWNER;

    @Column(nullable = false, columnDefinition = "VARCHAR(50) DEFAULT 'ACTIVE'")
    @Enumerated(EnumType.STRING)
    private ResidentStatus status = ResidentStatus.ACTIVE;

    @ManyToOne
    @JoinColumn(name = "apartment_id", nullable = false, foreignKey = @ForeignKey(name = "FK_resident_apartment"))
    private ApartmentEntity apartment;

}
