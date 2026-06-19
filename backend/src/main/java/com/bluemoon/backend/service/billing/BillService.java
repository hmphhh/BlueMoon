package com.bluemoon.backend.service.billing;
import com.bluemoon.backend.service.communication.NotificationService;


import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.bluemoon.backend.dtos.request.billing.CreateBillRequest;
import com.bluemoon.backend.dtos.request.billing.GenerateBillsRequest;
import com.bluemoon.backend.dtos.request.billing.UpdateBillRequest;
import com.bluemoon.backend.dtos.response.billing.ApartmentBillingSummaryResponse;
import com.bluemoon.backend.dtos.response.apartment.ApartmentResidentsSummaryResponse;
import com.bluemoon.backend.dtos.response.billing.ApartmentWithBillingSummaryResponse;
import com.bluemoon.backend.dtos.response.billing.BillDetailsResponse;
import com.bluemoon.backend.dtos.response.billing.BillSummaryResponse;
import com.bluemoon.backend.dtos.response.billing.BillingSummaryResponse;
import com.bluemoon.backend.entity.apartment.ApartmentEntity;
import com.bluemoon.backend.entity.billing.BillEntity;
import com.bluemoon.backend.entity.billing.BillTemplateEntity;
import com.bluemoon.backend.entity.billing.InvoiceEntity;
import com.bluemoon.backend.entity.auth.UserEntity;
import com.bluemoon.backend.enums.billing.BillStatus;
import com.bluemoon.backend.exceptions.InvalidOperationException;
import com.bluemoon.backend.exceptions.ResourceNotFoundException;
import com.bluemoon.backend.repository.apartment.ApartmentRepository;
import com.bluemoon.backend.repository.billing.BillRepository;
import com.bluemoon.backend.repository.auth.UserRepository;
import com.bluemoon.backend.enums.communication.NotificationPriority;
import com.bluemoon.backend.enums.communication.NotificationReferenceType;
import com.bluemoon.backend.enums.communication.NotificationType;

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

    @Autowired
    @Lazy
    private NotificationService notificationService;

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
     * Get all bills with optional filters (admin) — non-paginated.
     */
    public List<BillSummaryResponse> getAllBills(Long apartmentId, BillStatus status, String search) {
        return billRepository.findAllWithFilters(apartmentId, status, search).stream()
                .map(this::toSummaryResponse)
                .toList();
    }

    /**
     * Get all bills with optional filters (admin) — paginated.
     */
    public Page<BillSummaryResponse> getAllBills(
            Long apartmentId, BillStatus status, String search, Pageable pageable) {
        return billRepository.findAllWithFilters(apartmentId, status, search, pageable)
                .map(this::toSummaryResponse);
    }

    /**
     * Aggregate bill counts by status for admin stats cards (full scope).
     */
    public Map<String, Long> getBillStats() {
        Map<String, Long> stats = new LinkedHashMap<>();
        for (BillStatus s : BillStatus.values()) {
            stats.put(s.name(), billRepository.countByOptionalStatus(s));
        }
        return stats;
    }

    /**
     * Aggregate bill counts by status for user stats cards (user apartment scope).
     */
    public Map<String, Long> getMyBillStats(String username) {
        UserEntity user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        if (user.getApartment() == null) {
            throw new InvalidOperationException("User is not assigned to any apartment.");
        }
        Map<String, Long> stats = new LinkedHashMap<>();
        for (BillStatus s : BillStatus.values()) {
            stats.put(s.name(), billRepository.countByApartmentIdExcludingCancelledAndOptionalStatus(user.getApartment().getId(), s));
        }
        return stats;
    }

    /**
     * Get bills for the current user's apartment (excludes CANCELLED) — non-paginated.
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
     * Get bills for the current user's apartment (excludes CANCELLED) — paginated.
     */
    public Page<BillSummaryResponse> getMyBills(String username, BillStatus status, Pageable pageable) {
        UserEntity user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        if (user.getApartment() == null) {
            throw new InvalidOperationException("User is not assigned to any apartment.");
        }

        return billRepository.findByApartmentIdExcludingCancelled(
                        user.getApartment().getId(), status, pageable)
                .map(b -> new BillSummaryResponse(
                        b.getId(), null, null,
                        b.getTitle(), b.getAmount(), b.getStatus(), b.getDueDate()
                ));
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

        // Send BILL_CREATED notification to apartment residents
        notifyApartmentResidents(apartment, bill);

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

        // Send BILL_CREATED notification for each bill to apartment residents
        for (BillEntity bill : bills) {
            notifyApartmentResidents(bill.getApartment(), bill);
        }

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

        // Track which fields changed for targeted notifications
        boolean amountChanged = false;
        boolean dueDateChanged = false;

        if (request.getTitle() != null) {
            bill.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            bill.setDescription(request.getDescription());
        }
        if (request.getAmount() != null && request.getAmount().compareTo(bill.getAmount()) != 0) {
            bill.setAmount(request.getAmount());
            amountChanged = true;
        }
        if (request.getDueDate() != null && !request.getDueDate().equals(bill.getDueDate())) {
            bill.setDueDate(request.getDueDate());
            dueDateChanged = true;
        }
        if (request.getNote() != null) {
            bill.setNote(request.getNote());
        }

        bill = billRepository.save(bill);

        // Section 1.1: Notify apartment residents about amount/due date changes
        if (amountChanged) {
            notifyApartmentResidentsAboutBillChange(
                    bill.getApartment(), bill,
                    "Bill Amount Updated",
                    "The amount for bill \"" + bill.getTitle() + "\" has been updated to " + bill.getAmount() + ".",
                    NotificationType.BILL_AMOUNT_UPDATED
            );
        }
        if (dueDateChanged) {
            notifyApartmentResidentsAboutBillChange(
                    bill.getApartment(), bill,
                    "Bill Due Date Updated",
                    "The due date for bill \"" + bill.getTitle() + "\" has been updated to " + bill.getDueDate() + ".",
                    NotificationType.BILL_DUE_DATE_UPDATED
            );
        }

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

        // Section 3: Notify other admins about manual payment (admin-to-admin)
        try {
            String billTitles = bills.stream().map(BillEntity::getTitle).reduce((a, b) -> a + ", " + b).orElse("");
            notificationService.notifyOtherAdmins(
                    adminUser,
                    "Payment Marked as Paid",
                    "Bills [" + billTitles + "] have been manually marked as paid.",
                    NotificationType.PAYMENT_ACCEPTED,
                    NotificationReferenceType.PAYMENT,
                    invoice.getId(),
                    NotificationPriority.NORMAL
            );
        } catch (Exception e) {
            // Don't fail the operation if notification fails
        }
    }

    /**
     * Batch cancel bills (replaces single cancelBill).
     * Only allowed when status is UNPAID or OVERDUE.
     */
    @Transactional
    public void batchCancelBills(List<Long> billIds, String username) {
        UserEntity adminUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        List<BillEntity> bills = billRepository.findAllById(billIds);
        if (bills.size() != billIds.size()) {
            throw new InvalidOperationException("One or more bills not found.");
        }

        // Validate all bills before modifying
        for (BillEntity bill : bills) {
            validateModifiableStatus(bill);
        }

        // Cancel all bills and notify residents
        for (BillEntity bill : bills) {
            bill.setStatus(BillStatus.CANCELLED);
            // Release from any invoice if locked
            bill.setInvoiceId(null);
            billRepository.save(bill);

            // Section 1.1: Send BILL_CANCELLED notification to apartment residents
            List<UserEntity> residents = userRepository.findByApartmentId(bill.getApartment().getId());
            for (UserEntity resident : residents) {
                try {
                    notificationService.createAutoNotification(
                            resident,
                            "Bill Cancelled",
                            "The bill \"" + bill.getTitle() + "\" for your apartment has been cancelled.",
                            NotificationType.BILL_CANCELLED,
                            NotificationReferenceType.BILL,
                            bill.getId(),
                            NotificationPriority.NORMAL
                    );
                } catch (Exception e) {
                    // Don't fail bill cancellation if notification fails
                }
            }
        }

        // Section 3: Notify other admins about bill cancellation (admin-to-admin)
        try {
            String billTitles = bills.stream().map(BillEntity::getTitle).reduce((a, b) -> a + ", " + b).orElse("");
            notificationService.notifyOtherAdmins(
                    adminUser,
                    "Bills Cancelled",
                    "Bills [" + billTitles + "] have been cancelled.",
                    NotificationType.BILL_CANCELLED,
                    NotificationReferenceType.BILL,
                    null,
                    NotificationPriority.NORMAL
            );
        } catch (Exception e) {
            // Don't fail the operation if notification fails
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

    /**
     * Notify all residents of an apartment about a new bill (Section 1.1: BILL_CREATED).
     */
    private void notifyApartmentResidents(ApartmentEntity apartment, BillEntity bill) {
        try {
            List<UserEntity> residents = userRepository.findByApartmentId(apartment.getId());
            for (UserEntity resident : residents) {
                notificationService.createAutoNotification(
                        resident,
                        "New Bill Generated",
                        "A new bill \"" + bill.getTitle() + "\" has been generated for your apartment.",
                        NotificationType.BILL_CREATED,
                        NotificationReferenceType.BILL,
                        bill.getId(),
                        NotificationPriority.NORMAL
                );
            }
        } catch (Exception e) {
            // Don't fail bill creation if notification fails
        }
    }

    /**
     * Notify all residents of an apartment about a bill change (Section 1.1: amount/due date updates).
     */
    private void notifyApartmentResidentsAboutBillChange(
            ApartmentEntity apartment, BillEntity bill, String title, String message, NotificationType type) {
        try {
            List<UserEntity> residents = userRepository.findByApartmentId(apartment.getId());
            for (UserEntity resident : residents) {
                notificationService.createAutoNotification(
                        resident,
                        title,
                        message,
                        type,
                        NotificationReferenceType.BILL,
                        bill.getId(),
                        NotificationPriority.NORMAL
                );
            }
        } catch (Exception e) {
            // Don't fail bill update if notification fails
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
