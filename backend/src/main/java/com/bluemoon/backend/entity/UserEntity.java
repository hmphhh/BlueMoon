package com.bluemoon.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name = "users")
@Data
public class UserEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username; // = phone number for residents

    @Column(nullable = false)
    private String password; // = BCrypt(CCCD) for residents

    private String fullName;

    @Column(nullable = false, columnDefinition = "varchar(255) default 'USER'")
    private String role = "USER";

    private String email;

    private String phoneNumber; // set at registration, read-only for user

    @Column(unique = true)
    private String identityCardNumber; // CCCD, set at registration, read-only for user

    private String avatarUrl;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean isVerified = false;

    private String verificationToken;

    // Apartment relationship — nullable (admins don't have apartments)
    @ManyToOne
    @JoinColumn(name = "apartment_id")
    private ApartmentEntity apartment;
}
