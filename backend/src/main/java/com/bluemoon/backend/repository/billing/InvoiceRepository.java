package com.bluemoon.backend.repository.billing;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import com.bluemoon.backend.entity.billing.InvoiceEntity;
import com.bluemoon.backend.enums.billing.InvoiceStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
     * Paginated: invoices for a specific user with optional status filter.
     */
    @Query(value = """
        SELECT i FROM InvoiceEntity i
        JOIN FETCH i.createdBy u
        WHERE u.id = :userId
          AND (:status IS NULL OR i.status = :status)
          AND (i.status = com.bluemoon.backend.enums.billing.InvoiceStatus.PAID
               OR i.status = com.bluemoon.backend.enums.billing.InvoiceStatus.PENDING)
        ORDER BY i.createdAt DESC
    """,
    countQuery = """
        SELECT COUNT(i) FROM InvoiceEntity i
        JOIN i.createdBy u
        WHERE u.id = :userId
          AND (:status IS NULL OR i.status = :status)
          AND (i.status = com.bluemoon.backend.enums.billing.InvoiceStatus.PAID
               OR i.status = com.bluemoon.backend.enums.billing.InvoiceStatus.PENDING)
    """)
    Page<InvoiceEntity> findByCreatedByIdAndOptionalStatus(
        @Param("userId") Long userId,
        @Param("status") InvoiceStatus status,
        Pageable pageable
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

    /**
     * Paginated: all invoices with optional filters (admin).
     */
    @Query(value = """
        SELECT i FROM InvoiceEntity i
        JOIN FETCH i.createdBy u
        WHERE (:status IS NULL OR i.status = :status)
          AND (:createdBy IS NULL OR u.id = :createdBy)
          AND (:invoiceCode IS NULL OR :invoiceCode = '' OR i.invoiceCode LIKE CONCAT('%', :invoiceCode, '%'))
        ORDER BY i.createdAt DESC
    """,
    countQuery = """
        SELECT COUNT(i) FROM InvoiceEntity i
        JOIN i.createdBy u
        WHERE (:status IS NULL OR i.status = :status)
          AND (:createdBy IS NULL OR u.id = :createdBy)
          AND (:invoiceCode IS NULL OR :invoiceCode = '' OR i.invoiceCode LIKE CONCAT('%', :invoiceCode, '%'))
    """)
    Page<InvoiceEntity> findAllWithFilters(
        @Param("status") InvoiceStatus status,
        @Param("createdBy") Long createdBy,
        @Param("invoiceCode") String invoiceCode,
        Pageable pageable
    );

    /**
     * Count invoices by status (for admin stats card — full scope, not paginated).
     */
    @Query("SELECT COUNT(i) FROM InvoiceEntity i WHERE (:status IS NULL OR i.status = :status)")
    long countByOptionalStatus(@Param("status") InvoiceStatus status);

    /**
     * Count invoices by status for a specific user.
     */
    @Query("""
        SELECT COUNT(i) FROM InvoiceEntity i
        WHERE i.createdBy.id = :userId
          AND (:status IS NULL OR i.status = :status)
    """)
    long countByCreatedByIdAndOptionalStatus(
        @Param("userId") Long userId,
        @Param("status") InvoiceStatus status
    );

    Optional<InvoiceEntity> findByReferenceCode(String referenceCode);

    /**
     * Find all expired pending invoices.
     */
    @Query("""
        SELECT i FROM InvoiceEntity i
        WHERE i.status = com.bluemoon.backend.enums.billing.InvoiceStatus.PENDING
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
          AND i.status = com.bluemoon.backend.enums.billing.InvoiceStatus.PAID
    """)
    BigDecimal sumPaidAmountByApartmentContributionId(
        @Param("apartmentContributionId") Long apartmentContributionId
    );
}
