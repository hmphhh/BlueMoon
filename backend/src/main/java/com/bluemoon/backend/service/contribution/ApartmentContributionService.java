package com.bluemoon.backend.service.contribution;

import java.math.BigDecimal;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.bluemoon.backend.dtos.response.contribution.ApartmentContributionDetailResponse;
import com.bluemoon.backend.dtos.response.contribution.ApartmentContributionSummaryResponse;
import com.bluemoon.backend.dtos.response.contribution.ContributorResponse;
import com.bluemoon.backend.dtos.response.contribution.MyContributionResponse;
import com.bluemoon.backend.entity.contribution.ApartmentContributionEntity;
import com.bluemoon.backend.entity.apartment.ApartmentEntity;
import com.bluemoon.backend.entity.contribution.ContributionCampaignEntity;
import com.bluemoon.backend.entity.billing.InvoiceEntity;
import com.bluemoon.backend.entity.auth.UserEntity;
import com.bluemoon.backend.enums.contribution.ApartmentContributionStatus;
import com.bluemoon.backend.enums.contribution.ContributionType;
import com.bluemoon.backend.enums.billing.InvoiceStatus;
import com.bluemoon.backend.enums.billing.InvoiceType;
import com.bluemoon.backend.exceptions.InvalidOperationException;
import com.bluemoon.backend.exceptions.ResourceNotFoundException;
import com.bluemoon.backend.repository.contribution.ApartmentContributionRepository;
import com.bluemoon.backend.repository.billing.InvoiceRepository;
import com.bluemoon.backend.repository.auth.UserRepository;

/**
 * Service for managing apartment contribution records and recalculation logic.
 */
@Service
public class ApartmentContributionService {

    private static final Logger logger = LoggerFactory.getLogger(ApartmentContributionService.class);

    @Autowired
    private ApartmentContributionRepository apartmentContributionRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private UserRepository userRepository;

    // ============================================================
    // Retrieval
    // ============================================================

    /**
     * Get apartment contributions with optional filters (admin).
     */
    public List<ApartmentContributionSummaryResponse> getContributions(
            Long campaignId, Long apartmentId, ApartmentContributionStatus status) {

        return apartmentContributionRepository.findAllWithFilters(campaignId, apartmentId, status)
                .stream()
                .map(this::toSummaryResponse)
                .toList();
    }

    /**
     * Get detailed apartment contribution with contributor breakdown.
     */
    public ApartmentContributionDetailResponse getContributionDetail(Long id, Long userId, boolean isAdmin) {
        ApartmentContributionEntity ac = apartmentContributionRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Apartment contribution not found with id: " + id));

        // Ownership check for non-admin users
        if (!isAdmin) {
            UserEntity user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

            if (user.getApartment() == null ||
                    !user.getApartment().getId().equals(ac.getApartment().getId())) {
                throw new ResourceNotFoundException(
                        "Apartment contribution not found with id: " + id);
            }
        }

        return toDetailResponse(ac);
    }

    /**
     * Get contributions for the authenticated user's apartment — non-paginated.
     */
    public List<MyContributionResponse> getMyContributions(String username) {
        UserEntity user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        if (user.getApartment() == null) {
            throw new InvalidOperationException("User is not assigned to any apartment.");
        }

        return apartmentContributionRepository.findByApartmentId(user.getApartment().getId())
                .stream()
                .map(this::toMyContributionResponse)
                .toList();
    }

    /**
     * Get contributions for the authenticated user's apartment — paginated.
     */
    public Page<MyContributionResponse> getMyContributions(String username, Pageable pageable) {
        UserEntity user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        if (user.getApartment() == null) {
            throw new InvalidOperationException("User is not assigned to any apartment.");
        }

        return apartmentContributionRepository.findByApartmentId(user.getApartment().getId(), pageable)
                .map(this::toMyContributionResponse);
    }

    /**
     * Get apartment contribution stats for the current user's apartment.
     */
    public java.util.Map<String, Long> getMyContributionStats(String username) {
        UserEntity user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        if (user.getApartment() == null) {
            throw new InvalidOperationException("User is not assigned to any apartment.");
        }
        java.util.Map<String, Long> stats = new java.util.LinkedHashMap<>();
        for (ApartmentContributionStatus s : ApartmentContributionStatus.values()) {
            stats.put(s.name(), apartmentContributionRepository.countByApartmentIdAndOptionalStatus(user.getApartment().getId(), s));
        }
        return stats;
    }

    // ============================================================
    // Recalculation
    // ============================================================

    /**
     * Recalculate collectedAmount and status for an ApartmentContribution.
     * Uses SUM of PAID invoices for idempotent recalculation.
     */
    @Transactional
    public void recalculateContribution(Long apartmentContributionId) {
        ApartmentContributionEntity ac = apartmentContributionRepository.findByIdWithDetails(apartmentContributionId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Apartment contribution not found with id: " + apartmentContributionId));

        BigDecimal collected = invoiceRepository.sumPaidAmountByApartmentContributionId(apartmentContributionId);
        ac.setCollectedAmount(collected);

        // Determine status
        if (collected.compareTo(BigDecimal.ZERO) == 0) {
            ac.setStatus(ApartmentContributionStatus.NOT_STARTED);
        } else {
            ContributionCampaignEntity campaign = ac.getCampaign();
            if (campaign.getContributionType() == ContributionType.MANDATORY
                    && campaign.getRequiredAmount() != null
                    && collected.compareTo(campaign.getRequiredAmount()) >= 0) {
                ac.setStatus(ApartmentContributionStatus.COMPLETED);
            } else {
                ac.setStatus(ApartmentContributionStatus.STARTED);
            }
        }

        apartmentContributionRepository.save(ac);
        logger.info("Recalculated apartment contribution: id={}, collected={}, status={}",
                ac.getId(), ac.getCollectedAmount(), ac.getStatus());
    }

    // ============================================================
    // DTO Mapping
    // ============================================================

    private ApartmentContributionSummaryResponse toSummaryResponse(ApartmentContributionEntity ac) {
        ContributionCampaignEntity campaign = ac.getCampaign();
        ApartmentEntity apartment = ac.getApartment();

        return new ApartmentContributionSummaryResponse(
                ac.getId(),
                campaign.getId(),
                campaign.getTitle(),
                apartment.getId(),
                apartment.getApartmentNumber(),
                ac.getCollectedAmount(),
                campaign.getRequiredAmount(),
                ac.getStatus()
        );
    }

    private ApartmentContributionDetailResponse toDetailResponse(ApartmentContributionEntity ac) {
        ContributionCampaignEntity campaign = ac.getCampaign();
        ApartmentEntity apartment = ac.getApartment();

        // Build campaign info
        ApartmentContributionDetailResponse.CampaignInfo campaignInfo =
                new ApartmentContributionDetailResponse.CampaignInfo(
                        campaign.getId(),
                        campaign.getTitle(),
                        campaign.getContributionType(),
                        campaign.getStatus(),
                        campaign.getStartDate(),
                        campaign.getEndDate()
                );

        // Build apartment info
        ApartmentContributionDetailResponse.ApartmentInfo apartmentInfo =
                new ApartmentContributionDetailResponse.ApartmentInfo(
                        apartment.getId(),
                        apartment.getApartmentNumber()
                );

        // Build contributors from PAID invoices grouped by createdBy
        List<ContributorResponse> contributors = buildContributors(ac.getId());

        return new ApartmentContributionDetailResponse(
                ac.getId(),
                campaignInfo,
                apartmentInfo,
                campaign.getRequiredAmount(),
                ac.getCollectedAmount(),
                ac.getStatus(),
                contributors
        );
    }

    /**
     * Build per-user contribution breakdown from PAID invoices.
     * Groups by invoice.createdBy and sums amounts.
     */
    private List<ContributorResponse> buildContributors(Long apartmentContributionId) {
        // Get all PAID contribution invoices for this apartment contribution
        List<InvoiceEntity> paidInvoices = invoiceRepository.findAll().stream()
                .filter(i -> i.getInvoiceType() == InvoiceType.CONTRIBUTION)
                .filter(i -> i.getApartmentContribution() != null)
                .filter(i -> i.getApartmentContribution().getId().equals(apartmentContributionId))
                .filter(i -> i.getStatus() == InvoiceStatus.PAID)
                .toList();

        // Group by createdBy user and sum amounts
        return paidInvoices.stream()
                .collect(java.util.stream.Collectors.groupingBy(
                        i -> i.getCreatedBy().getId(),
                        java.util.stream.Collectors.toList()
                ))
                .entrySet().stream()
                .map(entry -> {
                    List<InvoiceEntity> userInvoices = entry.getValue();
                    UserEntity user = userInvoices.get(0).getCreatedBy();
                    BigDecimal total = userInvoices.stream()
                            .map(InvoiceEntity::getTotalAmount)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    return new ContributorResponse(user.getId(), user.getFullName(), total);
                })
                .toList();
    }

    private MyContributionResponse toMyContributionResponse(ApartmentContributionEntity ac) {
        ContributionCampaignEntity campaign = ac.getCampaign();
        return new MyContributionResponse(
                ac.getId(),
                campaign.getId(),
                campaign.getTitle(),
                campaign.getContributionType(),
                ac.getCollectedAmount(),
                campaign.getRequiredAmount(),
                ac.getStatus(),
                campaign.getStatus()
        );
    }
}
