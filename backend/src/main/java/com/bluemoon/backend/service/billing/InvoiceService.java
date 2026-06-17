package com.bluemoon.backend.service.billing;
import com.bluemoon.backend.service.communication.NotificationService;
import com.bluemoon.backend.service.contribution.ApartmentContributionService;


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
import com.bluemoon.backend.dtos.request.contribution.CreateContributionInvoiceRequest;
import com.bluemoon.backend.dtos.response.billing.InvoiceDetailsResponse;
import com.bluemoon.backend.dtos.response.billing.InvoiceResponse;
import com.bluemoon.backend.dtos.response.billing.InvoiceSummaryResponse;
import com.bluemoon.backend.dtos.response.auth.UserSummaryResponse;
import com.bluemoon.backend.entity.contribution.ApartmentContributionEntity;
import com.bluemoon.backend.entity.billing.BillEntity;
import com.bluemoon.backend.entity.contribution.ContributionCampaignEntity;
import com.bluemoon.backend.entity.billing.InvoiceBillSnapshotEntity;
import com.bluemoon.backend.entity.billing.InvoiceEntity;
import com.bluemoon.backend.entity.auth.UserEntity;
import com.bluemoon.backend.enums.billing.BillStatus;
import com.bluemoon.backend.enums.contribution.ContributionCampaignStatus;
import com.bluemoon.backend.enums.billing.InvoiceStatus;
import com.bluemoon.backend.enums.billing.InvoiceType;
import com.bluemoon.backend.exceptions.InvalidOperationException;
import com.bluemoon.backend.exceptions.ResourceNotFoundException;
import com.bluemoon.backend.repository.contribution.ApartmentContributionRepository;
import com.bluemoon.backend.repository.billing.BillRepository;
import com.bluemoon.backend.repository.billing.InvoiceBillSnapshotRepository;
import com.bluemoon.backend.repository.billing.InvoiceRepository;
import com.bluemoon.backend.repository.auth.UserRepository;
import com.bluemoon.backend.enums.communication.NotificationPriority;
import com.bluemoon.backend.enums.communication.NotificationReferenceType;
import com.bluemoon.backend.enums.communication.NotificationType;

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

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private ApartmentContributionRepository apartmentContributionRepository;

    @Autowired
    private ApartmentContributionService apartmentContributionService;

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
        invoice.setInvoiceType(InvoiceType.BILL);
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

    // ============================================================
    // Contribution Invoice Creation
    // ============================================================

    /**
     * Create a contribution invoice for an ApartmentContribution.
     * Validates: campaign active, date window, no existing pending invoice, positive amount.
     */
    @Transactional
    public InvoiceResponse createContributionInvoice(CreateContributionInvoiceRequest request, Long userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        // Validate apartment contribution exists
        ApartmentContributionEntity ac = apartmentContributionRepository.findByIdWithDetails(request.getApartmentContributionId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Apartment contribution not found with id: " + request.getApartmentContributionId()));

        // Validate ownership: user must belong to the same apartment
        if (user.getApartment() == null || !user.getApartment().getId().equals(ac.getApartment().getId())) {
            throw new InvalidOperationException(
                    "You can only create contribution invoices for your own apartment.");
        }

        // Validate campaign is ACTIVE
        ContributionCampaignEntity campaign = ac.getCampaign();
        if (campaign.getStatus() != ContributionCampaignStatus.ACTIVE) {
            throw new InvalidOperationException(
                    "Campaign is not active. Current status: " + campaign.getStatus());
        }

        // Validate current date is within campaign period
        LocalDate today = LocalDate.now();
        if (today.isBefore(campaign.getStartDate()) || today.isAfter(campaign.getEndDate())) {
            throw new InvalidOperationException(
                    "Contribution invoices can only be created between "
                    + campaign.getStartDate() + " and " + campaign.getEndDate() + ".");
        }

        // Validate no existing PENDING invoice for this apartment contribution
        if (invoiceRepository.existsByApartmentContributionIdAndStatus(
                ac.getId(), InvoiceStatus.PENDING)) {
            throw new InvalidOperationException(
                    "A pending contribution invoice already exists for this apartment contribution.");
        }

        // Generate codes
        String invoiceCode = generateInvoiceCode();
        String referenceCode = generateReferenceCode();

        // Build invoice entity
        InvoiceEntity invoice = new InvoiceEntity();
        invoice.setInvoiceType(InvoiceType.CONTRIBUTION);
        invoice.setApartmentContribution(ac);
        invoice.setInvoiceCode(invoiceCode);
        invoice.setReferenceCode(referenceCode);
        invoice.setCreatedBy(user);
        invoice.setTotalAmount(request.getAmount());
        invoice.setStatus(InvoiceStatus.PENDING);
        invoice.setExpiresAt(LocalDateTime.now().plusMinutes(sepayConfig.getInvoiceExpirationMinutes()));
        invoice.setQrCodeUrl(""); // placeholder
        invoice = invoiceRepository.save(invoice);

        // Generate real QR URL
        String qrCodeUrl = qrCodeService.generateQrCodeUrl(invoice);
        invoice.setQrCodeUrl(qrCodeUrl);
        invoice = invoiceRepository.save(invoice);

        logger.info("Created contribution invoice: id={}, apartmentContribution={}, amount={}",
                invoice.getId(), ac.getId(), request.getAmount());

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
        invoice.setInvoiceType(InvoiceType.BILL);
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
     * Mark an invoice as paid and settle the associated payment source.
     * For BILL invoices: settle all associated bills.
     * For CONTRIBUTION invoices: recalculate the apartment contribution.
     */
    @Transactional
    public void markAsPaid(Long invoiceId) {
        InvoiceEntity invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id: " + invoiceId));

        invoice.setStatus(InvoiceStatus.PAID);
        invoice.setPaidAt(LocalDateTime.now());
        invoiceRepository.save(invoice);

        if (invoice.getInvoiceType() == InvoiceType.CONTRIBUTION
                && invoice.getApartmentContribution() != null) {
            // Recalculate apartment contribution (idempotent SUM-based)
            apartmentContributionService.recalculateContribution(
                    invoice.getApartmentContribution().getId());

            // Notify apartment residents about the contribution payment
            try {
                ApartmentContributionEntity ac = invoice.getApartmentContribution();
                String campaignTitle = ac.getCampaign() != null ? ac.getCampaign().getTitle() : "Unknown";
                String payerName = invoice.getCreatedBy() != null ? invoice.getCreatedBy().getFullName() : "Someone";
                List<UserEntity> residents = userRepository.findByApartmentId(ac.getApartment().getId());
                for (UserEntity resident : residents) {
                    notificationService.createAutoNotification(
                            resident,
                            "Contribution Payment Received",
                            payerName + " contributed " + invoice.getTotalAmount()
                                    + " to campaign \"" + campaignTitle + "\".",
                            NotificationType.CONTRIBUTION_PAID,
                            NotificationReferenceType.CONTRIBUTION,
                            ac.getId(),
                            NotificationPriority.NORMAL
                    );
                }

                // Also notify admins
                notificationService.notifyAllAdmins(
                        "Contribution Payment Received",
                        "Room " + ac.getApartment().getApartmentNumber()
                                + ": " + payerName + " contributed " + invoice.getTotalAmount()
                                + " to campaign \"" + campaignTitle + "\".",
                        NotificationType.CONTRIBUTION_PAID,
                        NotificationReferenceType.CONTRIBUTION,
                        ac.getId(),
                        NotificationPriority.NORMAL
                );
            } catch (Exception e) {
                // Don't fail payment if notification fails
                logger.warn("Failed to send contribution payment notification: {}", e.getMessage());
            }
        } else {
            // Bill invoice: mark all bills as PAID
            markBillsPaid(invoiceId);
        }
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

            // Send INVOICE_EXPIRED notification to the invoice creator
            try {
                notificationService.createAutoNotification(
                        invoice.getCreatedBy(),
                        "Invoice Expired",
                        "Your invoice " + invoice.getInvoiceCode() + " has expired. Please create a new invoice if you still wish to pay.",
                        NotificationType.INVOICE_EXPIRED,
                        NotificationReferenceType.INVOICE,
                        invoice.getId(),
                        NotificationPriority.HIGH
                );
            } catch (Exception e) {
                // Don't fail expiration if notification fails
            }
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
