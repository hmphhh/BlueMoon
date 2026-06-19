package com.bluemoon.backend.controller.contribution;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import com.bluemoon.backend.dtos.response.contribution.ApartmentContributionDetailResponse;
import com.bluemoon.backend.dtos.response.contribution.ApartmentContributionSummaryResponse;
import com.bluemoon.backend.dtos.response.contribution.MyContributionResponse;
import com.bluemoon.backend.entity.auth.UserEntity;
import com.bluemoon.backend.enums.contribution.ApartmentContributionStatus;
import com.bluemoon.backend.exceptions.ResourceNotFoundException;
import com.bluemoon.backend.repository.auth.UserRepository;
import com.bluemoon.backend.service.contribution.ApartmentContributionService;

@RestController
@RequestMapping("/api/apartment-contributions")
public class ApartmentContributionController {

    @Autowired
    private ApartmentContributionService contributionService;

    @Autowired
    private UserRepository userRepository;

    /**
     * GET /api/apartment-contributions — List contributions with optional filters (admin only).
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<List<ApartmentContributionSummaryResponse>> getContributions(
            @RequestParam(required = false) Long campaignId,
            @RequestParam(required = false) Long apartmentId,
            @RequestParam(required = false) ApartmentContributionStatus status) {
        return ResponseEntity.ok(contributionService.getContributions(campaignId, apartmentId, status));
    }

    /**
     * GET /api/apartment-contributions/me — Get contributions for authenticated user's apartment.
     */
    @GetMapping("/me")
    public ResponseEntity<Page<MyContributionResponse>> getMyContributions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        int cappedSize = Math.min(size, 50);
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(contributionService.getMyContributions(
                username,
                PageRequest.of(page, cappedSize, Sort.by(Sort.Direction.DESC, "createdAt"))));
    }

    /**
     * GET /api/apartment-contributions/me/stats — Get contribution stats for user's apartment.
     */
    @GetMapping("/me/stats")
    public ResponseEntity<java.util.Map<String, Long>> getMyContributionStats() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(contributionService.getMyContributionStats(username));
    }

    /**
     * GET /api/apartment-contributions/{id} — Get contribution detail.
     * Admin: any contribution. User: only own apartment's contributions.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApartmentContributionDetailResponse> getContributionDetail(@PathVariable Long id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        Long userId = getCurrentUserId();
        return ResponseEntity.ok(contributionService.getContributionDetail(id, userId, isAdmin));
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
