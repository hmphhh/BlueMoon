package com.bluemoon.backend.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.bluemoon.backend.dtos.request.CreateBillRequest;
import com.bluemoon.backend.dtos.request.GenerateBillsRequest;
import com.bluemoon.backend.dtos.request.UpdateBillRequest;
import com.bluemoon.backend.dtos.response.ApartmentBillingSummaryResponse;
import com.bluemoon.backend.dtos.response.ApartmentResidentsSummaryResponse;
import com.bluemoon.backend.dtos.response.ApartmentWithBillingSummaryResponse;
import com.bluemoon.backend.dtos.response.BillDetailsResponse;
import com.bluemoon.backend.dtos.response.BillSummaryResponse;
import com.bluemoon.backend.dtos.response.BillingSummaryResponse;
import com.bluemoon.backend.entity.ApartmentEntity;
import com.bluemoon.backend.entity.BillEntity;
import com.bluemoon.backend.entity.BillTemplateEntity;
import com.bluemoon.backend.entity.InvoiceEntity;
import com.bluemoon.backend.entity.UserEntity;
import com.bluemoon.backend.enums.BillStatus;
import com.bluemoon.backend.exceptions.InvalidOperationException;
import com.bluemoon.backend.exceptions.ResourceNotFoundException;
import com.bluemoon.backend.repository.ApartmentRepository;
import com.bluemoon.backend.repository.BillRepository;
import com.bluemoon.backend.repository.UserRepository;

@Service
public class BillService {

    @Autowired
    private BillRepository billRepository;

    @Autowired
    private ApartmentRepository apartmentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BillTemplateService billTemplateService;

    @Autowired
    @Lazy
    private InvoiceService invoiceService;

    @Autowired
    @Lazy
    private PaymentService paymentService;

    // ============================================================
    // Apartment responses with billing summary (merged projections)
    // ============================================================

    /**
     * Get all apartments with residentCount + billingSummary.
     * Merges two JPQL projection queries to avoid N+1.
     */
    public List<ApartmentWithBillingSummaryResponse> getAllApartmentsWithBillingSummary() {
        List<ApartmentResidentsSummaryResponse> residents = apartmentRepository.findAllWithResidentCount();
        List<ApartmentBillingSummaryResponse> billings = apartmentRepository.findAllWithBillingSummaries();

        Map<Long, ApartmentBillingSummaryResponse> billingMap = billings.stream()
                .collect(Collectors.toMap(ApartmentBillingSummaryResponse::getApartmentId, b -> b));

        return residents.stream().map(r -> {
            ApartmentBillingSummaryResponse billing = billingMap.get(r.getId());
            BillingSummaryResponse summary = billing != null
                    ? new BillingSummaryResponse(billing.getUnpaidCount(), billing.getOverdueCount(), billing.getTotalOutstanding())
                    : new BillingSummaryResponse(0L, 0L, BigDecimal.ZERO);
            return new ApartmentWithBillingSummaryResponse(
                    r.getId(), r.getApartmentNumber(), r.getFloor(), r.getArea(),
                    r.getStatus(), r.getType(), r.getResidentCount(), summary
            );
        }).toList();
    }

    /**
     * Get a single apartment with residentCount + billingSummary.
     */
    public ApartmentWithBillingSummaryResponse getApartmentWithBillingSummary(Long apartmentId) {
        ApartmentResidentsSummaryResponse resident = apartmentRepository.findOneWithResidentCount(apartmentId);
        if (resident == null) {
            throw new ResourceNotFoundException("Apartment not found with id: " + apartmentId);
        }

        ApartmentBillingSummaryResponse billing = apartmentRepository.findOneWithBillingSummary(apartmentId);
        BillingSummaryResponse summary = billing != null
                ? new BillingSummaryResponse(billing.getUnpaidCount(), billing.getOverdueCount(), billing.getTotalOutstanding())
                : new BillingSummaryResponse(0L, 0L, BigDecimal.ZERO);

        return new ApartmentWithBillingSummaryResponse(
                resident.getId(), resident.getApartmentNumber(), resident.getFloor(), resident.getArea(),
                resident.getStatus(), resident.getType(), resident.getResidentCount(), summary
        );
    }

    // ============================================================
    // Bill CRUD
    // ============================================================

    /**
     * Get all bills with optional filters (admin).
     */
    public List<BillSummaryResponse> getAllBills(Long apartmentId, BillStatus status, String search) {
        return billRepository.findAllWithFilters(apartmentId, status, search).stream()
                .map(this::toSummaryResponse)
                .toList();
    }

    /**
     * Get bills for the current user's apartment (excludes CANCELLED).
     */
    public List<BillSummaryResponse> getMyBills(String username, BillStatus status) {
        UserEntity user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        if (user.getApartment() == null) {
            throw new InvalidOperationException("User is not assigned to any apartment.");
        }

        return billRepository.findByApartmentIdExcludingCancelled(user.getApartment().getId(), status)
                .stream()
                .map(b -> new BillSummaryResponse(
                        b.getId(), null, null,
                        b.getTitle(), b.getAmount(), b.getStatus(), b.getDueDate()
                ))
                .toList();
    }

    /**
     * Get bills for a specific apartment (admin).
     */
    public List<BillSummaryResponse> getBillsByApartment(Long apartmentId, BillStatus status) {
        // Verify apartment exists
        apartmentRepository.findById(apartmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Apartment not found with id: " + apartmentId));

        return billRepository.findByApartmentIdAndOptionalStatus(apartmentId, status).stream()
                .map(b -> new BillSummaryResponse(
                        b.getId(), null, null,
                        b.getTitle(), b.getAmount(), b.getStatus(), b.getDueDate()
                ))
                .toList();
    }

    /**
     * Get bill details by ID. For USER role, validates ownership and excludes CANCELLED.
     */
    public BillDetailsResponse getBillById(Long billId, String username, boolean isAdmin) {
        BillEntity bill = billRepository.findById(billId)
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found with id: " + billId));

        if (!isAdmin) {
            UserEntity user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

            if (user.getApartment() == null ||
                    !bill.getApartment().getId().equals(user.getApartment().getId())) {
                throw new ResourceNotFoundException("Bill not found with id: " + billId);
            }

            if (bill.getStatus() == BillStatus.CANCELLED) {
                throw new ResourceNotFoundException("Bill not found with id: " + billId);
            }
        }

        return toDetailsResponse(bill);
    }

    /**
     * Create a custom bill (FR-4).
     */
    @Transactional
    public BillSummaryResponse createBill(CreateBillRequest request) {
        ApartmentEntity apartment = apartmentRepository.findById(request.getApartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Apartment not found with id: " + request.getApartmentId()));

        BillEntity bill = new BillEntity();
        bill.setApartment(apartment);
        bill.setTitle(request.getTitle());
        bill.setDescription(request.getDescription());
        bill.setAmount(request.getAmount());
        bill.setDueDate(request.getDueDate());
        bill.setStatus(BillStatus.UNPAID);

        bill = billRepository.save(bill);
        return toSummaryResponse(bill);
    }

    /**
     * Generate bills from a template for selected apartments (FR-3).
     */
    @Transactional
    public int generateBills(GenerateBillsRequest request) {
        BillTemplateEntity template = billTemplateService.getTemplateEntityById(request.getTemplateId());

        List<BillEntity> bills = new ArrayList<>();
        for (Long apartmentId : request.getApartmentIds()) {
            ApartmentEntity apartment = apartmentRepository.findById(apartmentId)
                    .orElseThrow(() -> new ResourceNotFoundException("Apartment not found with id: " + apartmentId));

            BillEntity bill = new BillEntity();
            bill.setApartment(apartment);
            bill.setTitle(template.getName());
            bill.setDescription(template.getDescription());
            bill.setAmount(template.getDefaultAmount());
            bill.setDueDate(request.getDueDate());
            bill.setStatus(BillStatus.UNPAID);

            bills.add(bill);
        }

        billRepository.saveAll(bills);
        return bills.size();
    }

    /**
     * Update a bill (FR-6). Only allowed when status is UNPAID or OVERDUE.
     */
    @Transactional
    public BillSummaryResponse updateBill(Long billId, UpdateBillRequest request) {
        BillEntity bill = billRepository.findById(billId)
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found with id: " + billId));

        validateModifiableStatus(bill);

        if (request.getTitle() != null) {
            bill.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            bill.setDescription(request.getDescription());
        }
        if (request.getAmount() != null) {
            bill.setAmount(request.getAmount());
        }
        if (request.getDueDate() != null) {
            bill.setDueDate(request.getDueDate());
        }
        if (request.getNote() != null) {
            bill.setNote(request.getNote());
        }

        bill = billRepository.save(bill);
        return toSummaryResponse(bill);
    }

    /**
     * Batch mark bills as paid (replaces single markAsPaid).
     * Creates Invoice + Payment records for the selected bills.
     * If any bill is invalid, no changes are made (atomic operation).
     */
    @Transactional
    public void batchMarkAsPaid(List<Long> billIds, String username) {
        UserEntity adminUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        List<BillEntity> bills = billRepository.findAllById(billIds);
        if (bills.size() != billIds.size()) {
            throw new InvalidOperationException("One or more bills not found.");
        }

        // Validate all bills before modifying
        for (BillEntity bill : bills) {
            validateModifiableStatus(bill);
            if (bill.getInvoiceId() != null) {
                throw new InvalidOperationException(
                    "Bill " + bill.getId() + " is already assigned to an active invoice.");
            }
        }

        // Validate all bills belong to the same apartment
        Long apartmentId = bills.get(0).getApartment().getId();
        for (BillEntity bill : bills) {
            if (!bill.getApartment().getId().equals(apartmentId)) {
                throw new InvalidOperationException("All bills must belong to the same apartment.");
            }
        }

        // Create manual invoice (status = PAID immediately)
        InvoiceEntity invoice = invoiceService.createManualInvoice(bills, adminUser);

        // Create manual payment record
        BigDecimal totalAmount = bills.stream()
                .map(BillEntity::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        paymentService.createManualPayment(invoice, totalAmount);

        // Mark all bills as paid (bills stay linked to the invoice)
        for (BillEntity bill : bills) {
            bill.setStatus(BillStatus.PAID);
            bill.setPaidAt(LocalDateTime.now());
            // bill.invoiceId is already set by createManualInvoice
            billRepository.save(bill);
        }
    }

    /**
     * Batch cancel bills (replaces single cancelBill).
     * Only allowed when status is UNPAID or OVERDUE.
     */
    @Transactional
    public void batchCancelBills(List<Long> billIds) {
        List<BillEntity> bills = billRepository.findAllById(billIds);
        if (bills.size() != billIds.size()) {
            throw new InvalidOperationException("One or more bills not found.");
        }

        // Validate all bills before modifying
        for (BillEntity bill : bills) {
            validateModifiableStatus(bill);
        }

        // Cancel all bills
        for (BillEntity bill : bills) {
            bill.setStatus(BillStatus.CANCELLED);
            // Release from any invoice if locked
            bill.setInvoiceId(null);
            billRepository.save(bill);
        }
    }

    /**
     * Delete a bill. Only allowed when status is CANCELLED.
     */
    @Transactional
    public void deleteBill(Long billId) {
        BillEntity bill = billRepository.findById(billId)
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found with id: " + billId));

        if (bill.getStatus() != BillStatus.CANCELLED) {
            throw new InvalidOperationException("Only cancelled bills can be deleted. Current status: " + bill.getStatus());
        }

        billRepository.delete(bill);
    }

    // ============================================================
    // Automatic Overdue Detection (FR-9)
    // ============================================================

    /**
     * Scheduled task: mark UNPAID bills past due date as OVERDUE.
     * Runs daily at midnight.
     */
    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void detectOverdueBills() {
        List<BillEntity> overdueBills = billRepository.findOverdueBills();
        for (BillEntity bill : overdueBills) {
            bill.setStatus(BillStatus.OVERDUE);
        }
        if (!overdueBills.isEmpty()) {
            billRepository.saveAll(overdueBills);
        }
    }

    // ============================================================
    // Private helpers
    // ============================================================

    private void validateModifiableStatus(BillEntity bill) {
        if (bill.getStatus() != BillStatus.UNPAID && bill.getStatus() != BillStatus.OVERDUE) {
            throw new InvalidOperationException(
                    "Bill can only be modified when status is UNPAID or OVERDUE. Current status: " + bill.getStatus()
            );
        }
    }

    private BillSummaryResponse toSummaryResponse(BillEntity bill) {
        return new BillSummaryResponse(
                bill.getId(),
                bill.getApartment().getId(),
                bill.getApartment().getApartmentNumber(),
                bill.getTitle(),
                bill.getAmount(),
                bill.getStatus(),
                bill.getDueDate()
        );
    }

    private BillDetailsResponse toDetailsResponse(BillEntity bill) {
        return new BillDetailsResponse(
                bill.getId(),
                bill.getApartment().getId(),
                bill.getApartment().getApartmentNumber(),
                bill.getTitle(),
                bill.getDescription(),
                bill.getAmount(),
                bill.getDueDate(),
                bill.getStatus(),
                bill.getPaidAt(),
                bill.getCreatedAt()
        );
    }
}
