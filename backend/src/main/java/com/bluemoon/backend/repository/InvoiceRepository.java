package com.bluemoon.backend.repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import com.bluemoon.backend.entity.InvoiceEntity;
import com.bluemoon.backend.enums.InvoiceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface InvoiceRepository extends JpaRepository<InvoiceEntity, Long> {

    /**
     * Find all invoices created by a specific user, with optional status filter.
     */
    @Query("""
        SELECT i FROM InvoiceEntity i
        JOIN FETCH i.createdBy u
        WHERE u.id = :userId
          AND (:status IS NULL OR i.status = :status)
        ORDER BY i.createdAt DESC
    """)
    List<InvoiceEntity> findByCreatedByIdAndOptionalStatus(
        @Param("userId") Long userId,
        @Param("status") InvoiceStatus status
    );

    /**
     * Find all invoices with optional filters (admin).
     */
    @Query("""
        SELECT i FROM InvoiceEntity i
        JOIN FETCH i.createdBy u
        WHERE (:status IS NULL OR i.status = :status)
          AND (:createdBy IS NULL OR u.id = :createdBy)
          AND (:invoiceCode IS NULL OR :invoiceCode = '' OR i.invoiceCode LIKE CONCAT('%', :invoiceCode, '%'))
        ORDER BY i.createdAt DESC
    """)
    List<InvoiceEntity> findAllWithFilters(
        @Param("status") InvoiceStatus status,
        @Param("createdBy") Long createdBy,
        @Param("invoiceCode") String invoiceCode
    );

    Optional<InvoiceEntity> findByReferenceCode(String referenceCode);

    /**
     * Find all expired pending invoices.
     */
    @Query("""
        SELECT i FROM InvoiceEntity i
        WHERE i.status = com.bluemoon.backend.enums.InvoiceStatus.PENDING
          AND i.expiresAt < :now
    """)
    List<InvoiceEntity> findExpiredPendingInvoices(@Param("now") LocalDateTime now);

    /**
     * Count invoices created today (for generating sequential invoice codes).
     */
    @Query("""
        SELECT COUNT(i) FROM InvoiceEntity i
        WHERE i.createdAt >= :startOfDay
    """)
    long countInvoicesCreatedSince(@Param("startOfDay") LocalDateTime startOfDay);

    /**
     * Check if a reference code already exists.
     */
    boolean existsByReferenceCode(String referenceCode);

    /**
     * Check if an invoice code already exists.
     */
    boolean existsByInvoiceCode(String invoiceCode);

    /**
     * Check if an ApartmentContribution already has an invoice with the given status.
     * Used to enforce the "at most one PENDING invoice per ApartmentContribution" rule.
     */
    boolean existsByApartmentContributionIdAndStatus(Long apartmentContributionId, InvoiceStatus status);

    /**
     * Sum the totalAmount of all PAID invoices linked to a specific ApartmentContribution.
     * Returns null if no PAID invoices exist (caller should treat null as ZERO).
     */
    @Query("""
        SELECT COALESCE(SUM(i.totalAmount), 0)
        FROM InvoiceEntity i
        WHERE i.apartmentContribution.id = :apartmentContributionId
          AND i.status = com.bluemoon.backend.enums.InvoiceStatus.PAID
    """)
    BigDecimal sumPaidAmountByApartmentContributionId(
        @Param("apartmentContributionId") Long apartmentContributionId
    );
}
