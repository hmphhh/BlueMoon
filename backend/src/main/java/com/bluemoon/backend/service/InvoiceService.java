package com.bluemoon.backend.service;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.bluemoon.backend.config.SepayConfig;
import com.bluemoon.backend.dtos.response.InvoiceDetailsResponse;
import com.bluemoon.backend.dtos.response.InvoiceResponse;
import com.bluemoon.backend.dtos.response.InvoiceSummaryResponse;
import com.bluemoon.backend.dtos.response.UserSummaryResponse;
import com.bluemoon.backend.entity.BillEntity;
import com.bluemoon.backend.entity.InvoiceBillSnapshotEntity;
import com.bluemoon.backend.entity.InvoiceEntity;
import com.bluemoon.backend.entity.UserEntity;
import com.bluemoon.backend.enums.BillStatus;
import com.bluemoon.backend.enums.InvoiceStatus;
import com.bluemoon.backend.exceptions.InvalidOperationException;
import com.bluemoon.backend.exceptions.ResourceNotFoundException;
import com.bluemoon.backend.repository.BillRepository;
import com.bluemoon.backend.repository.InvoiceBillSnapshotRepository;
import com.bluemoon.backend.repository.InvoiceRepository;
import com.bluemoon.backend.repository.UserRepository;

/**
 * Core business service for the payment module.
 * Handles invoice creation, cancellation, expiration, and settlement.
 */
@Service
public class InvoiceService {

    private static final Logger logger = LoggerFactory.getLogger(InvoiceService.class);
    private static final String REFERENCE_CODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final int REFERENCE_CODE_LENGTH = 8;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd");
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private BillRepository billRepository;

    @Autowired
    private InvoiceBillSnapshotRepository snapshotRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private QrCodeService qrCodeService;

    @Autowired
    private SepayConfig sepayConfig;

    // ============================================================
    // Invoice Creation
    // ============================================================

    /**
     * Create an invoice for the given bill IDs.
     * BR-01: Validates bills, calculates total, generates codes, creates QR, locks bills.
     */
    @Transactional
    public InvoiceResponse createInvoice(List<Long> billIds, Long userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        // Step 3: Validate bills
        List<BillEntity> bills = validateBills(billIds);

        // Step 4: Calculate total amount
        BigDecimal totalAmount = calculateTotalAmount(bills);

        // Step 5: Generate codes
        String invoiceCode = generateInvoiceCode();
        String referenceCode = generateReferenceCode();

        // Build invoice entity
        InvoiceEntity invoice = new InvoiceEntity();
        invoice.setInvoiceCode(invoiceCode);
        invoice.setReferenceCode(referenceCode);
        invoice.setCreatedBy(user);
        invoice.setTotalAmount(totalAmount);
        invoice.setStatus(InvoiceStatus.PENDING);
        invoice.setExpiresAt(LocalDateTime.now().plusMinutes(sepayConfig.getInvoiceExpirationMinutes()));

        // Step 6: Generate QR (needs reference code and amount on entity first)
        // Set a temporary QR URL, then update after save
        invoice.setQrCodeUrl(""); // placeholder
        invoice = invoiceRepository.save(invoice);

        // Generate real QR URL
        String qrCodeUrl = qrCodeService.generateQrCodeUrl(invoice);
        invoice.setQrCodeUrl(qrCodeUrl);
        invoice = invoiceRepository.save(invoice);

        // Step 8: Lock bills and create snapshots
        lockBills(bills, invoice.getId());

        // Create bill snapshots for audit trail
        for (BillEntity bill : bills) {
            snapshotRepository.save(new InvoiceBillSnapshotEntity(invoice.getId(), bill.getId()));
        }

        return toInvoiceResponse(invoice);
    }

    /**
     * Create an invoice for manual bill payment (admin marks bills as paid).
     * Returns the created invoice entity for linking with the payment record.
     */
    @Transactional
    public InvoiceEntity createManualInvoice(List<BillEntity> bills, UserEntity adminUser) {
        BigDecimal totalAmount = calculateTotalAmount(bills);
        String invoiceCode = generateInvoiceCode();
        String referenceCode = generateReferenceCode();

        InvoiceEntity invoice = new InvoiceEntity();
        invoice.setInvoiceCode(invoiceCode);
        invoice.setReferenceCode(referenceCode);
        invoice.setCreatedBy(adminUser);
        invoice.setTotalAmount(totalAmount);
        invoice.setStatus(InvoiceStatus.PAID);
        invoice.setPaidAt(LocalDateTime.now());
        invoice.setExpiresAt(LocalDateTime.now()); // immediate, already paid
        invoice.setQrCodeUrl(""); // no QR needed for manual payment
        invoice = invoiceRepository.save(invoice);

        // Generate QR URL even for manual (for consistency in display)
        String qrCodeUrl = qrCodeService.generateQrCodeUrl(invoice);
        invoice.setQrCodeUrl(qrCodeUrl);
        invoice = invoiceRepository.save(invoice);

        // Lock bills to this invoice and create snapshots
        for (BillEntity bill : bills) {
            bill.setInvoiceId(invoice.getId());
            billRepository.save(bill);
            snapshotRepository.save(new InvoiceBillSnapshotEntity(invoice.getId(), bill.getId()));
        }

        return invoice;
    }

    // ============================================================
    // Invoice Retrieval
    // ============================================================

    /**
     * Get invoice by ID.
     */
    public InvoiceDetailsResponse getInvoiceDetails(Long invoiceId) {
        InvoiceEntity invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id: " + invoiceId));

        List<Long> billIds = snapshotRepository.findByInvoiceId(invoiceId).stream()
                .map(InvoiceBillSnapshotEntity::getBillId)
                .toList();

        return toInvoiceDetailsResponse(invoice, billIds);
    }

    /**
     * Get invoices created by the authenticated user.
     * Only shows PAID and PENDING invoices.
     */
    public List<InvoiceSummaryResponse> getMyInvoices(Long userId, InvoiceStatus status) {
        List<InvoiceEntity> invoices = invoiceRepository.findByCreatedByIdAndOptionalStatus(userId, status);

        return invoices.stream()
                .filter(i -> i.getStatus() == InvoiceStatus.PAID || i.getStatus() == InvoiceStatus.PENDING)
                .map(i -> toInvoiceSummaryResponse(i, false))
                .toList();
    }

    /**
     * Get all invoices with optional filters (admin).
     */
    public List<InvoiceSummaryResponse> getAllInvoices(InvoiceStatus status, Long createdBy, String invoiceCode) {
        return invoiceRepository.findAllWithFilters(status, createdBy, invoiceCode).stream()
                .map(i -> toInvoiceSummaryResponse(i, true))
                .toList();
    }

    // ============================================================
    // Invoice Cancellation (BR-03)
    // ============================================================

    /**
     * Cancel a pending invoice. Only the creator can cancel.
     */
    @Transactional
    public void cancelInvoice(Long invoiceId, Long userId) {
        InvoiceEntity invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id: " + invoiceId));

        if (invoice.getStatus() != InvoiceStatus.PENDING) {
            throw new InvalidOperationException(
                "Only PENDING invoices can be cancelled. Current status: " + invoice.getStatus());
        }

        if (!invoice.getCreatedBy().getId().equals(userId)) {
            throw new InvalidOperationException("Only the invoice creator can cancel this invoice.");
        }

        invoice.setStatus(InvoiceStatus.CANCELLED);
        invoice.setCancelledAt(LocalDateTime.now());
        invoiceRepository.save(invoice);

        // Release bills
        releaseBills(invoiceId);
    }

    // ============================================================
    // Invoice Settlement (BR-06)
    // ============================================================

    /**
     * Mark an invoice as paid and settle all associated bills.
     */
    @Transactional
    public void markAsPaid(Long invoiceId) {
        InvoiceEntity invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id: " + invoiceId));

        invoice.setStatus(InvoiceStatus.PAID);
        invoice.setPaidAt(LocalDateTime.now());
        invoiceRepository.save(invoice);

        // Mark all bills as PAID (bills stay linked to the invoice per data consistency rule)
        markBillsPaid(invoiceId);
    }

    // ============================================================
    // Invoice Expiration (BR-04)
    // ============================================================

    /**
     * Scheduled task: expire pending invoices past their expiration time.
     * Runs every 5 minutes.
     */
    @Scheduled(fixedRate = 300000)
    @Transactional
    public void expirePendingInvoices() {
        List<InvoiceEntity> expiredInvoices = invoiceRepository.findExpiredPendingInvoices(LocalDateTime.now());

        for (InvoiceEntity invoice : expiredInvoices) {
            invoice.setStatus(InvoiceStatus.EXPIRED);
            invoiceRepository.save(invoice);
            releaseBills(invoice.getId());
            logger.info("Expired invoice: {}", invoice.getInvoiceCode());
        }

        if (!expiredInvoices.isEmpty()) {
            logger.info("Expired {} pending invoices", expiredInvoices.size());
        }
    }

    // ============================================================
    // Validation Helpers
    // ============================================================

    /**
     * Validate that the given bill IDs are eligible for invoicing.
     */
    private List<BillEntity> validateBills(List<Long> billIds) {
        List<BillEntity> bills = billRepository.findAllById(billIds);

        if (bills.size() != billIds.size()) {
            throw new InvalidOperationException("One or more bills not found.");
        }

        // All bills must be unpaid or overdue
        for (BillEntity bill : bills) {
            if (bill.getStatus() != BillStatus.UNPAID && bill.getStatus() != BillStatus.OVERDUE) {
                throw new InvalidOperationException(
                    "Bill " + bill.getId() + " is not eligible for payment. Status: " + bill.getStatus());
            }
        }

        // All bills must belong to the same apartment
        Long apartmentId = bills.get(0).getApartment().getId();
        for (BillEntity bill : bills) {
            if (!bill.getApartment().getId().equals(apartmentId)) {
                throw new InvalidOperationException("All bills must belong to the same apartment.");
            }
        }

        // No bill should be locked by another active invoice
        for (BillEntity bill : bills) {
            if (bill.getInvoiceId() != null) {
                throw new InvalidOperationException(
                    "Bill " + bill.getId() + " is already assigned to an active invoice.");
            }
        }

        return bills;
    }

    private BigDecimal calculateTotalAmount(List<BillEntity> bills) {
        return bills.stream()
                .map(BillEntity::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    // ============================================================
    // Code Generation
    // ============================================================

    /**
     * Generate invoice code in format: INV-yyyyMMdd-NNN
     */
    private String generateInvoiceCode() {
        String datePart = LocalDate.now().format(DATE_FORMATTER);
        LocalDateTime startOfDay = LocalDate.now().atTime(LocalTime.MIN);
        long count = invoiceRepository.countInvoicesCreatedSince(startOfDay);
        String code;
        do {
            count++;
            code = String.format("INV%s%03d", datePart, count);
        } while (invoiceRepository.existsByInvoiceCode(code));
        return code;
    }

    /**
     * Generate reference code in format: PAY-XXXXXXXX (8 random alphanumeric chars)
     */
    private String generateReferenceCode() {
        String code;
        do {
            StringBuilder sb = new StringBuilder("PAY");
            for (int i = 0; i < REFERENCE_CODE_LENGTH; i++) {
                sb.append(REFERENCE_CODE_CHARS.charAt(SECURE_RANDOM.nextInt(REFERENCE_CODE_CHARS.length())));
            }
            code = sb.toString();
        } while (invoiceRepository.existsByReferenceCode(code));
        return code;
    }

    // ============================================================
    // Bill Locking / Releasing
    // ============================================================

    private void lockBills(List<BillEntity> bills, Long invoiceId) {
        for (BillEntity bill : bills) {
            bill.setInvoiceId(invoiceId);
            billRepository.save(bill);
        }
    }

    private void releaseBills(Long invoiceId) {
        List<InvoiceBillSnapshotEntity> snapshots = snapshotRepository.findByInvoiceId(invoiceId);
        List<Long> billIds = snapshots.stream().map(InvoiceBillSnapshotEntity::getBillId).toList();

        List<BillEntity> bills = billRepository.findAllById(billIds);
        for (BillEntity bill : bills) {
            // Only release if still locked to this invoice
            if (invoiceId.equals(bill.getInvoiceId())) {
                bill.setInvoiceId(null);
                billRepository.save(bill);
            }
        }
    }

    private void markBillsPaid(Long invoiceId) {
        List<InvoiceBillSnapshotEntity> snapshots = snapshotRepository.findByInvoiceId(invoiceId);
        List<Long> billIds = snapshots.stream().map(InvoiceBillSnapshotEntity::getBillId).toList();

        List<BillEntity> bills = billRepository.findAllById(billIds);
        for (BillEntity bill : bills) {
            bill.setStatus(BillStatus.PAID);
            bill.setPaidAt(LocalDateTime.now());
            // bill.invoiceId stays set (data consistency: PAID invoice -> bills must reference it)
            billRepository.save(bill);
        }
    }

    // ============================================================
    // DTO Mapping
    // ============================================================

    private UserSummaryResponse toUserSummary(UserEntity user) {
        return new UserSummaryResponse(user.getId(), user.getFullName());
    }

    private InvoiceResponse toInvoiceResponse(InvoiceEntity invoice) {
        return new InvoiceResponse(
                invoice.getId(),
                invoice.getInvoiceCode(),
                invoice.getReferenceCode(),
                invoice.getStatus(),
                invoice.getTotalAmount(),
                toUserSummary(invoice.getCreatedBy()),
                invoice.getQrCodeUrl(),
                invoice.getCreatedAt(),
                invoice.getExpiresAt(),
                invoice.getPaidAt(),
                invoice.getCancelledAt()
        );
    }

    private InvoiceSummaryResponse toInvoiceSummaryResponse(InvoiceEntity invoice, boolean includeCreatedBy) {
        UserSummaryResponse createdBy = includeCreatedBy ? toUserSummary(invoice.getCreatedBy()) : null;
        return new InvoiceSummaryResponse(
                invoice.getId(),
                invoice.getInvoiceCode(),
                invoice.getStatus(),
                invoice.getTotalAmount(),
                createdBy,
                invoice.getCreatedAt()
        );
    }

    private InvoiceDetailsResponse toInvoiceDetailsResponse(InvoiceEntity invoice, List<Long> billIds) {
        return new InvoiceDetailsResponse(
                invoice.getId(),
                invoice.getInvoiceCode(),
                invoice.getReferenceCode(),
                invoice.getStatus(),
                invoice.getTotalAmount(),
                toUserSummary(invoice.getCreatedBy()),
                invoice.getQrCodeUrl(),
                invoice.getCreatedAt(),
                invoice.getExpiresAt(),
                invoice.getPaidAt(),
                invoice.getCancelledAt(),
                billIds
        );
    }
}
