package com.bluemoon.backend.controller.contribution;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import com.bluemoon.backend.dtos.request.contribution.CreateCampaignRequest;
import com.bluemoon.backend.dtos.request.contribution.UpdateCampaignRequest;
import com.bluemoon.backend.dtos.response.contribution.CampaignDetailResponse;
import com.bluemoon.backend.dtos.response.contribution.CampaignSummaryResponse;
import com.bluemoon.backend.entity.auth.UserEntity;
import com.bluemoon.backend.enums.contribution.ContributionCampaignStatus;
import com.bluemoon.backend.enums.contribution.ContributionType;
import com.bluemoon.backend.exceptions.ResourceNotFoundException;
import com.bluemoon.backend.repository.auth.UserRepository;
import com.bluemoon.backend.service.contribution.ContributionCampaignService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/contribution-campaigns")
@PreAuthorize("hasRole('ADMIN')")
public class ContributionCampaignController {

    @Autowired
    private ContributionCampaignService campaignService;

    @Autowired
    private UserRepository userRepository;

    /**
     * POST /api/contribution-campaigns — Create a new campaign.
     */
    @PostMapping
    public ResponseEntity<CampaignSummaryResponse> createCampaign(
            @Valid @RequestBody CreateCampaignRequest request) {
        Long userId = getCurrentUserId();
        CampaignSummaryResponse response = campaignService.createCampaign(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * GET /api/contribution-campaigns — List campaigns with optional filters.
     */
    @GetMapping
    public ResponseEntity<Page<CampaignSummaryResponse>> getCampaigns(
            @RequestParam(required = false) ContributionCampaignStatus status,
            @RequestParam(required = false) ContributionType contributionType,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        int cappedSize = Math.min(size, 50);
        return ResponseEntity.ok(campaignService.getCampaigns(
                status, contributionType, startDate, endDate,
                PageRequest.of(page, cappedSize, Sort.by(Sort.Direction.DESC, "createdAt"))));
    }

    /**
     * GET /api/contribution-campaigns/stats — Campaign counts by status (admin only).
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getCampaignStats() {
        return ResponseEntity.ok(campaignService.getCampaignStats());
    }

    /**
     * GET /api/contribution-campaigns/{id} — Get campaign detail.
     */
    @GetMapping("/{id}")
    public ResponseEntity<CampaignDetailResponse> getCampaignDetail(@PathVariable Long id) {
        return ResponseEntity.ok(campaignService.getCampaignDetail(id));
    }

    /**
     * PUT /api/contribution-campaigns/{id} — Update a DRAFT campaign.
     */
    @PutMapping("/{id}")
    public ResponseEntity<CampaignDetailResponse> updateCampaign(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCampaignRequest request) {
        return ResponseEntity.ok(campaignService.updateCampaign(id, request));
    }

    /**
     * POST /api/contribution-campaigns/{id}/launch — Launch a campaign.
     */
    @PostMapping("/{id}/launch")
    public ResponseEntity<Map<String, String>> launchCampaign(@PathVariable Long id) {
        campaignService.launchCampaign(id);
        return ResponseEntity.ok(Map.of("message", "Campaign launched successfully."));
    }

    /**
     * POST /api/contribution-campaigns/{id}/cancel — Cancel a DRAFT campaign.
     */
    @PostMapping("/{id}/cancel")
    public ResponseEntity<Map<String, String>> cancelCampaign(@PathVariable Long id) {
        campaignService.cancelCampaign(id);
        return ResponseEntity.ok(Map.of("message", "Campaign cancelled successfully."));
    }

    /**
     * POST /api/contribution-campaigns/{id}/complete — Complete an ACTIVE campaign.
     */
    @PostMapping("/{id}/complete")
    public ResponseEntity<Map<String, String>> completeCampaign(@PathVariable Long id) {
        campaignService.completeCampaign(id);
        return ResponseEntity.ok(Map.of("message", "Campaign completed successfully."));
    }

    // ============================================================
    // Private Helpers
    // ============================================================

    private Long getCurrentUserId() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        UserEntity user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        return user.getId();
    }
}
