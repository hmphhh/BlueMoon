package com.bluemoon.backend.repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import com.bluemoon.backend.entity.ApartmentContributionEntity;
import com.bluemoon.backend.enums.ApartmentContributionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ApartmentContributionRepository extends JpaRepository<ApartmentContributionEntity, Long> {

    /**
     * Find all apartment contributions with optional filters.
     * JOIN FETCH campaign and apartment to avoid N+1.
     */
    @Query("""
        SELECT ac FROM ApartmentContributionEntity ac
        JOIN FETCH ac.campaign c
        JOIN FETCH ac.apartment a
        WHERE (:campaignId IS NULL OR c.id = :campaignId)
          AND (:apartmentId IS NULL OR a.id = :apartmentId)
          AND (:status IS NULL OR ac.status = :status)
        ORDER BY ac.createdAt DESC
    """)
    List<ApartmentContributionEntity> findAllWithFilters(
        @Param("campaignId") Long campaignId,
        @Param("apartmentId") Long apartmentId,
        @Param("status") ApartmentContributionStatus status
    );

    /**
     * Find an apartment contribution by ID with campaign and apartment eagerly fetched.
     */
    @Query("""
        SELECT ac FROM ApartmentContributionEntity ac
        JOIN FETCH ac.campaign c
        JOIN FETCH ac.apartment a
        WHERE ac.id = :id
    """)
    Optional<ApartmentContributionEntity> findByIdWithDetails(@Param("id") Long id);

    /**
     * Find all apartment contributions for a given apartment.
     * JOIN FETCH campaign to include campaign info in the response.
     */
    @Query("""
        SELECT ac FROM ApartmentContributionEntity ac
        JOIN FETCH ac.campaign c
        WHERE ac.apartment.id = :apartmentId
          AND c.status <> com.bluemoon.backend.enums.ContributionCampaignStatus.CANCELED
        ORDER BY ac.createdAt DESC
    """)
    List<ApartmentContributionEntity> findByApartmentId(@Param("apartmentId") Long apartmentId);

    boolean existsByCampaignIdAndApartmentId(Long campaignId, Long apartmentId);

    /**
     * Find all apartment contributions for a given campaign.
     */
    List<ApartmentContributionEntity> findByCampaignId(Long campaignId);
}
