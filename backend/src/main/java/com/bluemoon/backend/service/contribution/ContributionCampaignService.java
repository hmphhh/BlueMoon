package com.bluemoon.backend.service.contribution;
import com.bluemoon.backend.service.communication.NotificationService;


import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.bluemoon.backend.dtos.request.contribution.CreateCampaignRequest;
import com.bluemoon.backend.dtos.request.contribution.UpdateCampaignRequest;
import com.bluemoon.backend.dtos.response.contribution.CampaignDetailResponse;
import com.bluemoon.backend.dtos.response.contribution.CampaignSummaryResponse;
import com.bluemoon.backend.dtos.response.auth.UserSummaryResponse;
import com.bluemoon.backend.entity.contribution.ApartmentContributionEntity;
import com.bluemoon.backend.entity.apartment.ApartmentEntity;
import com.bluemoon.backend.entity.contribution.ContributionCampaignEntity;
import com.bluemoon.backend.entity.auth.UserEntity;
import com.bluemoon.backend.enums.contribution.ApartmentContributionStatus;
import com.bluemoon.backend.enums.contribution.ContributionCampaignStatus;
import com.bluemoon.backend.enums.contribution.ContributionType;
import com.bluemoon.backend.enums.communication.NotificationPriority;
import com.bluemoon.backend.enums.communication.NotificationReferenceType;
import com.bluemoon.backend.enums.communication.NotificationType;
import com.bluemoon.backend.enums.auth.UserRole;
import com.bluemoon.backend.exceptions.InvalidOperationException;
import com.bluemoon.backend.exceptions.ResourceNotFoundException;
import com.bluemoon.backend.repository.contribution.ApartmentContributionRepository;
import com.bluemoon.backend.repository.apartment.ApartmentRepository;
import com.bluemoon.backend.repository.contribution.ContributionCampaignRepository;
import com.bluemoon.backend.repository.auth.UserRepository;

/**
 * Service for managing contribution campaign lifecycle.
 */
@Service
public class ContributionCampaignService {

    private static final Logger logger = LoggerFactory.getLogger(ContributionCampaignService.class);

    @Autowired
    private ContributionCampaignRepository campaignRepository;

    @Autowired
    private ApartmentContributionRepository apartmentContributionRepository;

    @Autowired
    private ApartmentRepository apartmentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationService notificationService;

    // ============================================================
    // Campaign CRUD
    // ============================================================

    /**
     * Create a new contribution campaign in DRAFT status.
     */
    @Transactional
    public CampaignSummaryResponse createCampaign(CreateCampaignRequest request, Long userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        validateCampaignData(request.getContributionType(), request.getStartDate(),
                request.getEndDate(), request.getRequiredAmount(), request.getTargetAmount());

        ContributionCampaignEntity campaign = new ContributionCampaignEntity();
        campaign.setTitle(request.getTitle());
        campaign.setDescription(request.getDescription());
        campaign.setContributionType(request.getContributionType());
        campaign.setStartDate(request.getStartDate());
        campaign.setEndDate(request.getEndDate());
        campaign.setRequiredAmount(request.getRequiredAmount());
        campaign.setTargetAmount(request.getTargetAmount());
        campaign.setStatus(ContributionCampaignStatus.DRAFT);
        campaign.setCreatedBy(user);

        campaign = campaignRepository.save(campaign);
        logger.info("Created contribution campaign: id={}, title={}", campaign.getId(), campaign.getTitle());

        return toCampaignSummary(campaign);
    }

    /**
     * List campaigns with optional filters — non-paginated.
     */
    public List<CampaignSummaryResponse> getCampaigns(
            ContributionCampaignStatus status,
            ContributionType contributionType,
            LocalDate startDate,
            LocalDate endDate) {
        return campaignRepository.findAllWithFilters(status, contributionType, startDate, endDate)
                .stream()
                .map(this::toCampaignSummary)
                .toList();
    }

    /**
     * List campaigns with optional filters — paginated.
     */
    public Page<CampaignSummaryResponse> getCampaigns(
            ContributionCampaignStatus status,
            ContributionType contributionType,
            LocalDate startDate,
            LocalDate endDate,
            Pageable pageable) {
        return campaignRepository.findAllWithFilters(status, contributionType, startDate, endDate, pageable)
                .map(this::toCampaignSummary);
    }

    /**
     * Campaign counts by status for admin stats cards (full scope).
     */
    public Map<String, Long> getCampaignStats() {
        Map<String, Long> stats = new java.util.LinkedHashMap<>();
        for (ContributionCampaignStatus s : ContributionCampaignStatus.values()) {
            stats.put(s.name(), campaignRepository.countByOptionalStatus(s));
        }
        return stats;
    }

    /**
     * Get detailed campaign information.
     */
    public CampaignDetailResponse getCampaignDetail(Long id) {
        ContributionCampaignEntity campaign = campaignRepository.findByIdWithCreatedBy(id)
                .orElseThrow(() -> new ResourceNotFoundException("Campaign not found with id: " + id));
        return toCampaignDetail(campaign);
    }

    /**
     * Update a DRAFT campaign.
     */
    @Transactional
    public CampaignDetailResponse updateCampaign(Long id, UpdateCampaignRequest request) {
        ContributionCampaignEntity campaign = campaignRepository.findByIdWithCreatedBy(id)
                .orElseThrow(() -> new ResourceNotFoundException("Campaign not found with id: " + id));

        if (campaign.getStatus() != ContributionCampaignStatus.DRAFT) {
            throw new InvalidOperationException(
                    "Only DRAFT campaigns can be updated. Current status: " + campaign.getStatus());
        }

        validateCampaignData(campaign.getContributionType(), request.getStartDate(),
                request.getEndDate(), request.getRequiredAmount(), request.getTargetAmount());

        campaign.setTitle(request.getTitle());
        campaign.setDescription(request.getDescription());
        campaign.setStartDate(request.getStartDate());
        campaign.setEndDate(request.getEndDate());
        campaign.setRequiredAmount(request.getRequiredAmount());
        campaign.setTargetAmount(request.getTargetAmount());

        campaign = campaignRepository.save(campaign);
        logger.info("Updated contribution campaign: id={}", campaign.getId());

        return toCampaignDetail(campaign);
    }

    // ============================================================
    // Campaign Lifecycle Actions
    // ============================================================

    /**
     * Launch a DRAFT campaign:
     *   1. Validate campaign configuration
     *   2. Reject if endDate is before current date
     *   3. Generate ApartmentContribution records for all apartments
     *   4. Set status to ACTIVE
     */
    @Transactional
    public void launchCampaign(Long id) {
        ContributionCampaignEntity campaign = campaignRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Campaign not found with id: " + id));

        if (campaign.getStatus() != ContributionCampaignStatus.DRAFT) {
            throw new InvalidOperationException(
                    "Only DRAFT campaigns can be launched. Current status: " + campaign.getStatus());
        }

        if (campaign.getEndDate().isBefore(LocalDate.now())) {
            throw new InvalidOperationException(
                    "Cannot launch campaign: end date " + campaign.getEndDate() + " is before the current date.");
        }

        // Generate ApartmentContribution records for all apartments
        List<ApartmentEntity> apartments = apartmentRepository.findAll();
        List<ApartmentContributionEntity> contributions = apartments.stream()
                .map(apartment -> {
                    ApartmentContributionEntity ac = new ApartmentContributionEntity();
                    ac.setCampaign(campaign);
                    ac.setApartment(apartment);
                    ac.setCollectedAmount(BigDecimal.ZERO);
                    ac.setStatus(ApartmentContributionStatus.NOT_STARTED);
                    return ac;
                })
                .toList();

        apartmentContributionRepository.saveAll(contributions);

        campaign.setStatus(ContributionCampaignStatus.ACTIVE);
        campaignRepository.save(campaign);

        logger.info("Launched campaign: id={}, generated {} apartment contributions",
                campaign.getId(), contributions.size());

        // Notify all residents about the new campaign
        notifyAllResidents(
                "New Contribution Campaign",
                "A new " + campaign.getContributionType() + " contribution campaign \"" + campaign.getTitle() + "\" has been launched.",
                NotificationType.CAMPAIGN_LAUNCHED,
                NotificationReferenceType.CAMPAIGN,
                campaign.getId()
        );
    }

    /**
     * Cancel a DRAFT campaign (before launch).
     */
    @Transactional
    public void cancelCampaign(Long id) {
        ContributionCampaignEntity campaign = campaignRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Campaign not found with id: " + id));

        if (campaign.getStatus() != ContributionCampaignStatus.DRAFT) {
            throw new InvalidOperationException(
                    "Only DRAFT campaigns can be cancelled. Current status: " + campaign.getStatus());
        }

        campaign.setStatus(ContributionCampaignStatus.CANCELED);
        campaignRepository.save(campaign);
        logger.info("Cancelled campaign: id={}", campaign.getId());
    }

    /**
     * Complete an ACTIVE campaign.
     * After completion, no new contribution invoices may be created.
     * Existing PENDING invoices may still be paid until their own expiry.
     */
    @Transactional
    public void completeCampaign(Long id) {
        ContributionCampaignEntity campaign = campaignRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Campaign not found with id: " + id));

        if (campaign.getStatus() != ContributionCampaignStatus.ACTIVE) {
            throw new InvalidOperationException(
                    "Only ACTIVE campaigns can be completed. Current status: " + campaign.getStatus());
        }

        campaign.setStatus(ContributionCampaignStatus.COMPLETED);
        campaignRepository.save(campaign);

        // Mark all apartment contributions as COMPLETED
        List<ApartmentContributionEntity> contributions =
                apartmentContributionRepository.findByCampaignId(campaign.getId());
        for (ApartmentContributionEntity ac : contributions) {
            ac.setStatus(ApartmentContributionStatus.COMPLETED);
        }
        apartmentContributionRepository.saveAll(contributions);

        logger.info("Completed campaign: id={}, finalized {} apartment contributions",
                campaign.getId(), contributions.size());

        // Notify all residents that the campaign has ended
        notifyAllResidents(
                "Campaign Completed",
                "The contribution campaign \"" + campaign.getTitle() + "\" has been completed. No further contributions will be accepted.",
                NotificationType.CAMPAIGN_COMPLETED,
                NotificationReferenceType.CAMPAIGN,
                campaign.getId()
        );
    }

    // ============================================================
    // Validation
    // ============================================================

    /**
     * Validate campaign data rules shared between create and update.
     */
    private void validateCampaignData(ContributionType type, LocalDate startDate,
                                       LocalDate endDate, BigDecimal requiredAmount,
                                       BigDecimal targetAmount) {
        if (startDate.isAfter(endDate)) {
            throw new InvalidOperationException("Start date must be before or equal to end date.");
        }

        if (type == ContributionType.MANDATORY) {
            if (requiredAmount == null || requiredAmount.compareTo(BigDecimal.ZERO) <= 0) {
                throw new InvalidOperationException(
                        "MANDATORY campaigns require a positive requiredAmount.");
            }
        } else if (type == ContributionType.VOLUNTARY) {
            if (requiredAmount != null) {
                throw new InvalidOperationException(
                        "VOLUNTARY campaigns must not have a requiredAmount.");
            }
        }

        if (targetAmount != null && targetAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new InvalidOperationException("targetAmount must be greater than zero if provided.");
        }
    }

    // ============================================================
    // Notification Helpers
    // ============================================================

    /**
     * Notify all USER-role residents about a campaign event.
     */
    private void notifyAllResidents(String title, String message,
                                     NotificationType type,
                                     NotificationReferenceType refType, Long refId) {
        try {
            List<UserEntity> residents = userRepository.findByRole(UserRole.USER);
            for (UserEntity resident : residents) {
                notificationService.createAutoNotification(
                        resident, title, message, type, refType, refId,
                        NotificationPriority.NORMAL
                );
            }
        } catch (Exception e) {
            // Don't fail campaign operation if notification fails
            logger.warn("Failed to send campaign notifications: {}", e.getMessage());
        }
    }

    // ============================================================
    // DTO Mapping
    // ============================================================

    private CampaignSummaryResponse toCampaignSummary(ContributionCampaignEntity campaign) {
        return new CampaignSummaryResponse(
                campaign.getId(),
                campaign.getTitle(),
                campaign.getContributionType(),
                campaign.getStatus(),
                campaign.getStartDate(),
                campaign.getEndDate(),
                campaign.getTargetAmount(),
                campaign.getRequiredAmount(),
                campaign.getCreatedAt()
        );
    }

    private CampaignDetailResponse toCampaignDetail(ContributionCampaignEntity campaign) {
        UserSummaryResponse createdBy = new UserSummaryResponse(
                campaign.getCreatedBy().getId(),
                campaign.getCreatedBy().getFullName()
        );

        return new CampaignDetailResponse(
                campaign.getId(),
                campaign.getTitle(),
                campaign.getDescription(),
                campaign.getContributionType(),
                campaign.getStatus(),
                campaign.getStartDate(),
                campaign.getEndDate(),
                campaign.getTargetAmount(),
                campaign.getRequiredAmount(),
                createdBy,
                campaign.getCreatedAt()
        );
    }
}
