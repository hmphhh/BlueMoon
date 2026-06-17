package com.bluemoon.backend.entity.billing;
import com.bluemoon.backend.entity.auth.UserEntity;
import com.bluemoon.backend.entity.contribution.ApartmentContributionEntity;


import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.bluemoon.backend.enums.billing.InvoiceStatus;
import com.bluemoon.backend.enums.billing.InvoiceType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "invoices")
@Getter
@Setter
@NoArgsConstructor
public class InvoiceEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private InvoiceType invoiceType = InvoiceType.BILL;

    @Column(nullable = false, unique = true, length = 50)
    private String invoiceCode;

    @Column(nullable = false, unique = true, length = 100)
    private String referenceCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private UserEntity createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "apartment_contribution_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private ApartmentContributionEntity apartmentContribution;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private InvoiceStatus status;

    @Column(nullable = false, length = 1000)
    private String qrCodeUrl;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    private LocalDateTime paidAt;

    private LocalDateTime cancelledAt;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
