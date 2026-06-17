package com.bluemoon.backend.repository.apartment;
import com.bluemoon.backend.entity.auth.UserEntity;
import com.bluemoon.backend.enums.billing.BillStatus;


import com.bluemoon.backend.dtos.response.billing.ApartmentBillingSummaryResponse;
import com.bluemoon.backend.dtos.response.apartment.ApartmentResidentsSummaryResponse;
import com.bluemoon.backend.dtos.response.apartment.ApartmentResponse;
import com.bluemoon.backend.entity.apartment.ApartmentEntity;
import com.bluemoon.backend.enums.apartment.ResidentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ApartmentRepository extends JpaRepository<ApartmentEntity, Long> {

    Optional<ApartmentEntity> findByApartmentNumber(String apartmentNumber);

    /**
     * Count the number of active users assigned to an apartment (excludes MOVED_OUT).
     */
    @Query("SELECT COUNT(u) FROM UserEntity u WHERE u.apartment.id = :apartmentId AND (u.status IS NULL OR u.status <> :excludedStatus)")
    Long countActiveUsersByApartmentId(@Param("apartmentId") Long apartmentId, @Param("excludedStatus") ResidentStatus excludedStatus);

    /**
     * Count ALL users assigned to an apartment (including MOVED_OUT, for deletion guard).
     */
    @Query("SELECT COUNT(u) FROM UserEntity u WHERE u.apartment.id = :apartmentId")
    Long countUsersByApartmentId(@Param("apartmentId") Long apartmentId);

    /**
     * Get all apartments with user count using JPQL to avoid N+1 queries.
     * (Legacy query kept for backward compatibility)
     */
    @Query("""
        SELECT new com.bluemoon.backend.dtos.response.apartment.ApartmentResponse(
            a.id,
            a.apartmentNumber,
            a.floor,
            a.area,
            a.status,
            a.type,
            COUNT(CASE WHEN u.status IS NULL OR u.status <> 'MOVED_OUT' THEN u.id END)
        )
        FROM ApartmentEntity a
        LEFT JOIN a.users u
        GROUP BY a.id, a.apartmentNumber, a.floor, a.area, a.status, a.type
    """)
    List<ApartmentResponse> findAllWithUserCount();

    /**
     * Get all apartments with resident count (for merging with billing summary).
     */
    @Query("""
        SELECT new com.bluemoon.backend.dtos.response.apartment.ApartmentResidentsSummaryResponse(
            a.id,
            a.apartmentNumber,
            a.floor,
            a.area,
            a.status,
            a.type,
            COUNT(u.id)
        )
        FROM ApartmentEntity a
        LEFT JOIN a.users u
        GROUP BY
            a.id,
            a.apartmentNumber,
            a.floor,
            a.area,
            a.status,
            a.type
        ORDER BY a.apartmentNumber
    """)
    List<ApartmentResidentsSummaryResponse> findAllWithResidentCount();

    /**
     * Get resident count for a single apartment.
     */
    @Query("""
        SELECT new com.bluemoon.backend.dtos.response.apartment.ApartmentResidentsSummaryResponse(
            a.id,
            a.apartmentNumber,
            a.floor,
            a.area,
            a.status,
            a.type,
            COUNT(u.id)
        )
        FROM ApartmentEntity a
        LEFT JOIN a.users u
        WHERE a.id = :apartmentId
        GROUP BY
            a.id,
            a.apartmentNumber,
            a.floor,
            a.area,
            a.status,
            a.type
    """)
    ApartmentResidentsSummaryResponse findOneWithResidentCount(@Param("apartmentId") Long apartmentId);

    /**
     * Get all apartments with billing summaries.
     */
    @Query("""
        SELECT new com.bluemoon.backend.dtos.response.billing.ApartmentBillingSummaryResponse(
            a.id,
            SUM(
                CASE
                    WHEN b.status = com.bluemoon.backend.enums.billing.BillStatus.UNPAID
                    THEN 1
                    ELSE 0
                END
            ),
            SUM(
                CASE
                    WHEN b.status = com.bluemoon.backend.enums.billing.BillStatus.OVERDUE
                    THEN 1
                    ELSE 0
                END
            ),
            COALESCE(
                SUM(
                    CASE
                        WHEN b.status IN (
                            com.bluemoon.backend.enums.billing.BillStatus.UNPAID,
                            com.bluemoon.backend.enums.billing.BillStatus.OVERDUE
                        )
                        THEN b.amount
                        ELSE 0
                    END
                ),
                0
            )
        )
        FROM ApartmentEntity a
        LEFT JOIN a.bills b
        GROUP BY a.id
    """)
    List<ApartmentBillingSummaryResponse> findAllWithBillingSummaries();

    /**
     * Get billing summary for a single apartment.
     */
    @Query("""
        SELECT new com.bluemoon.backend.dtos.response.billing.ApartmentBillingSummaryResponse(
            a.id,
            SUM(
                CASE
                    WHEN b.status = com.bluemoon.backend.enums.billing.BillStatus.UNPAID
                    THEN 1
                    ELSE 0
                END
            ),
            SUM(
                CASE
                    WHEN b.status = com.bluemoon.backend.enums.billing.BillStatus.OVERDUE
                    THEN 1
                    ELSE 0
                END
            ),
            COALESCE(
                SUM(
                    CASE
                        WHEN b.status IN (
                            com.bluemoon.backend.enums.billing.BillStatus.UNPAID,
                            com.bluemoon.backend.enums.billing.BillStatus.OVERDUE
                        )
                        THEN b.amount
                        ELSE 0
                    END
                ),
                0
            )
        )
        FROM ApartmentEntity a
        LEFT JOIN a.bills b
        WHERE a.id = :apartmentId
        GROUP BY a.id
    """)
    ApartmentBillingSummaryResponse findOneWithBillingSummary(@Param("apartmentId") Long apartmentId);
}

