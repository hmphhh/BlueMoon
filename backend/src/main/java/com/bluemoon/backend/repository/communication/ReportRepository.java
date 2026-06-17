package com.bluemoon.backend.repository.communication;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.bluemoon.backend.dtos.response.communication.AdminReportSummaryResponse;
import com.bluemoon.backend.entity.communication.ReportEntity;
import com.bluemoon.backend.enums.communication.ReportStatus;

public interface ReportRepository extends JpaRepository<ReportEntity, Long> {

    List<ReportEntity> findByCreatedByIdOrderByCreatedAtDesc(Long userId);

    List<ReportEntity> findByCreatedByIdAndStatusOrderByCreatedAtDesc(Long userId, ReportStatus status);

    /**
     * Admin listing with JPQL constructor query to avoid N+1.
     * Joins user + apartment, with optional filters for status, userId, apartmentId.
     */
    @Query("""
        SELECT new com.bluemoon.backend.dtos.response.communication.AdminReportSummaryResponse(
            r.id,
            r.title,
            r.status,
            u.id,
            u.fullName,
            a.apartmentNumber,
            r.createdAt
        )
        FROM ReportEntity r
        JOIN r.createdBy u
        LEFT JOIN u.apartment a
        WHERE (:status IS NULL OR r.status = :status)
        AND (:userId IS NULL OR u.id = :userId)
        AND (:apartmentId IS NULL OR a.id = :apartmentId)
        ORDER BY r.createdAt DESC
    """)
    Page<AdminReportSummaryResponse> findAllReports(
        @Param("status") ReportStatus status,
        @Param("userId") Long userId,
        @Param("apartmentId") Long apartmentId,
        Pageable pageable
    );
}
