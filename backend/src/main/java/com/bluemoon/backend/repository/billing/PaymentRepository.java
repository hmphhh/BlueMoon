package com.bluemoon.backend.repository.billing;

import java.util.List;
import java.util.Optional;

import com.bluemoon.backend.entity.billing.PaymentEntity;
import com.bluemoon.backend.enums.billing.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PaymentRepository extends JpaRepository<PaymentEntity, Long> {

    /**
     * Find all payments for a specific invoice.
     */
    @Query("""
        SELECT p FROM PaymentEntity p
        WHERE p.invoice.id = :invoiceId
        ORDER BY p.createdAt DESC
    """)
    List<PaymentEntity> findByInvoiceId(@Param("invoiceId") Long invoiceId);

    /**
     * Find all payments ordered by creation time.
     */
    @Query("""
        SELECT p FROM PaymentEntity p
        JOIN FETCH p.invoice
        ORDER BY p.createdAt DESC
    """)
    List<PaymentEntity> findAllWithInvoice();

    /**
     * Paginated: all payments (admin).
     */
    @Query(value = """
        SELECT p FROM PaymentEntity p
        JOIN FETCH p.invoice
        ORDER BY p.createdAt DESC
    """,
    countQuery = "SELECT COUNT(p) FROM PaymentEntity p")
    Page<PaymentEntity> findAllWithInvoice(Pageable pageable);

    /**
     * Count payments by status for admin stats (full scope, not paginated).
     */
    @Query("SELECT COUNT(p) FROM PaymentEntity p WHERE p.status = :status")
    long countByStatus(@Param("status") PaymentStatus status);

    /**
     * Check if a transaction code has already been processed.
     */
    boolean existsByTransactionCode(String transactionCode);

    Optional<PaymentEntity> findByTransactionCode(String transactionCode);

    /**
     * Check if a SePay transaction ID has already been processed.
     * Used for webhook idempotency.
     */
    boolean existsByTransactionId(Long transactionId);

    /**
     * Find payment by SePay transaction ID.
     * Used to retrieve existing payment for duplicate webhooks.
     */
    Optional<PaymentEntity> findByTransactionId(Long transactionId);
}
