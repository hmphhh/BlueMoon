package com.bluemoon.backend.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import lombok.Data;

@Entity
@Table(name = "users")
@Data
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username; // = phone number for residents

    @Column(nullable = false)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password; // = BCrypt(CCCD) for residents

    private String fullName;

    @Column(nullable = false, columnDefinition = "varchar(255) default 'USER'")
    private String role = "USER";

    @Email(message = "Email must be valid")
    private String email;

    private String phoneNumber; // set at registration, read-only for user

    @Column(unique = true)
    private String identityCardNumber; // CCCD, set at registration, read-only for user

    private String avatarUrl;

    @Column(nullable = false, columnDefinition = "boolean default false")
    @JsonProperty("isVerified")
    private boolean isVerified = false;

    private String verificationToken;

    // Apartment relationship — nullable (admins don't have apartments)
    @ManyToOne
    @JoinColumn(name = "apartment_id")
    private Apartment apartment;

    // Convenience getter for JSON serialization
    @JsonProperty("apartmentNumber")
    public String getApartmentNumber() {
        return apartment != null ? apartment.getApartmentNumber() : null;
    }
}
