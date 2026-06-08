package com.bluemoon.backend.repository;

import java.util.List;

import com.bluemoon.backend.entity.BillEntity;
import com.bluemoon.backend.enums.BillStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BillRepository extends JpaRepository<BillEntity, Long> {

    /**
     * Find bills with optional filters: apartmentId, status, search (title).
     */
    @Query("""
        SELECT b FROM BillEntity b
        JOIN FETCH b.apartment a
        WHERE (:apartmentId IS NULL OR a.id = :apartmentId)
          AND (:status IS NULL OR b.status = :status)
          AND (:search IS NULL OR :search = ''
               OR LOWER(b.title) LIKE LOWER(CONCAT('%', :search, '%')))
        ORDER BY b.createdAt DESC
    """)
    List<BillEntity> findAllWithFilters(
        @Param("apartmentId") Long apartmentId,
        @Param("status") BillStatus status,
        @Param("search") String search
    );

    /**
     * Find bills for a specific apartment, optionally filtered by status.
     */
    @Query("""
        SELECT b FROM BillEntity b
        WHERE b.apartment.id = :apartmentId
          AND (:status IS NULL OR b.status = :status)
        ORDER BY b.createdAt DESC
    """)
    List<BillEntity> findByApartmentIdAndOptionalStatus(
        @Param("apartmentId") Long apartmentId,
        @Param("status") BillStatus status
    );

    /**
     * Find bills for a user's apartment, excluding CANCELLED status.
     */
    @Query("""
        SELECT b FROM BillEntity b
        WHERE b.apartment.id = :apartmentId
          AND b.status <> com.bluemoon.backend.enums.BillStatus.CANCELLED
          AND (:status IS NULL OR b.status = :status)
        ORDER BY b.createdAt DESC
    """)
    List<BillEntity> findByApartmentIdExcludingCancelled(
        @Param("apartmentId") Long apartmentId,
        @Param("status") BillStatus status
    );

    /**
     * Find all UNPAID bills that are past due date (for overdue detection).
     */
    @Query("""
        SELECT b FROM BillEntity b
        WHERE b.status = com.bluemoon.backend.enums.BillStatus.UNPAID
          AND b.dueDate < CURRENT_DATE
    """)
    List<BillEntity> findOverdueBills();
}
