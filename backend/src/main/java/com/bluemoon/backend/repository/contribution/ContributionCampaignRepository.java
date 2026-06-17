package com.bluemoon.backend.repository.contribution;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import com.bluemoon.backend.entity.contribution.ContributionCampaignEntity;
import com.bluemoon.backend.enums.contribution.ContributionCampaignStatus;
import com.bluemoon.backend.enums.contribution.ContributionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ContributionCampaignRepository extends JpaRepository<ContributionCampaignEntity, Long> {

    /**
     * Find all campaigns with optional filters. Uses JOIN FETCH to avoid N+1 on createdBy.
     */
    @Query("""
        SELECT c FROM ContributionCampaignEntity c
        JOIN FETCH c.createdBy
        WHERE (:status IS NULL OR c.status = :status)
          AND (:contributionType IS NULL OR c.contributionType = :contributionType)
          AND (CAST(:startDate AS date) IS NULL OR c.startDate >= :startDate)
          AND (CAST(:endDate AS date) IS NULL OR c.endDate <= :endDate)
        ORDER BY c.createdAt DESC
    """)
    List<ContributionCampaignEntity> findAllWithFilters(
        @Param("status") ContributionCampaignStatus status,
        @Param("contributionType") ContributionType contributionType,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );

    /**
     * Find a campaign by ID with createdBy eagerly fetched.
     */
    @Query("""
        SELECT c FROM ContributionCampaignEntity c
        JOIN FETCH c.createdBy
        WHERE c.id = :id
    """)
    Optional<ContributionCampaignEntity> findByIdWithCreatedBy(@Param("id") Long id);
}
