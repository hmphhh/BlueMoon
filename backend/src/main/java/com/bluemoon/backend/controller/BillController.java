package com.bluemoon.backend.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.bluemoon.backend.dtos.request.CreateBillRequest;
import com.bluemoon.backend.dtos.response.BillResponse;
import com.bluemoon.backend.entity.BillEntity;
import com.bluemoon.backend.entity.UserEntity;
import com.bluemoon.backend.enums.BillStatus;
import com.bluemoon.backend.exceptions.InvalidOperationException;
import com.bluemoon.backend.exceptions.ResourceNotFoundException;
import com.bluemoon.backend.mapper.BillMapper;
import com.bluemoon.backend.repository.UserRepository;
import com.bluemoon.backend.service.BillService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/bills")
public class BillController {

    @Autowired
    private BillService billService;

    @Autowired
    private BillMapper billMapper;

    @Autowired
    private UserRepository userRepository;

    /**
     * Admin creates a new bill for an apartment.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<BillResponse> createBill(
            @Valid @RequestBody CreateBillRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        UserEntity currentUser = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        BillEntity bill = billService.createBill(request, currentUser);
        return ResponseEntity.ok(billMapper.toResponse(bill));
    }

    /**
     * Admin gets all bills.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<List<BillResponse>> getAllBills() {
        List<BillResponse> bills = billService.getAllBills().stream()
                .map(billMapper::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(bills);
    }

    /**
     * Resident gets their own bills based on their apartment.
     */
    @GetMapping("/my")
    public ResponseEntity<List<BillResponse>> getMyBills(
            @AuthenticationPrincipal UserDetails userDetails) {

        UserEntity currentUser = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (currentUser.getApartment() == null) {
            return ResponseEntity.ok(List.of());
        }

        List<BillResponse> bills = billService
                .getBillsByApartment(currentUser.getApartment().getApartmentNumber())
                .stream()
                .map(billMapper::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(bills);
    }

    /**
     * Admin updates bill status (e.g. mark as paid).
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/status")
    public ResponseEntity<BillResponse> updateBillStatus(
            @PathVariable Long id,
            @RequestParam String status) {

        BillStatus billStatus;
        try {
            billStatus = BillStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new InvalidOperationException("Invalid status: " + status);
        }

        BillEntity bill = billService.updateBillStatus(id, billStatus);
        return ResponseEntity.ok(billMapper.toResponse(bill));
    }
}
