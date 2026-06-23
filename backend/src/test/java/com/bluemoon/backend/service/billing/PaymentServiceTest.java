package com.bluemoon.backend.service.billing;

import com.bluemoon.backend.dtos.request.billing.PaymentWebhookRequest;
import com.bluemoon.backend.entity.billing.InvoiceEntity;
import com.bluemoon.backend.entity.billing.PaymentEntity;
import com.bluemoon.backend.entity.auth.UserEntity;
import com.bluemoon.backend.enums.billing.InvoiceStatus;
import com.bluemoon.backend.enums.billing.PaymentFailureReason;
import com.bluemoon.backend.enums.billing.PaymentStatus;
import com.bluemoon.backend.repository.billing.InvoiceRepository;
import com.bluemoon.backend.repository.billing.PaymentRepository;
import com.bluemoon.backend.service.communication.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests cho PaymentService – TC-18, TC-19, TC-20
 * Kiểm thử nghiệp vụ webhook thanh toán: hợp lệ, sai số tiền, trùng giao dịch.
 */
@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock private PaymentRepository paymentRepository;
    @Mock private InvoiceRepository invoiceRepository;
    @Mock private InvoiceService invoiceService;
    @Mock private NotificationService notificationService;

    @InjectMocks
    private PaymentService paymentService;

    private InvoiceEntity pendingInvoice;
    private UserEntity creator;

    @BeforeEach
    void setUp() {
        creator = new UserEntity();
        creator.setId(10L);
        creator.setUsername("resident01");
        creator.setFullName("Nguyễn Hoàng Gia");

        pendingInvoice = new InvoiceEntity();
        pendingInvoice.setId(1L);
        pendingInvoice.setInvoiceCode("INV202606240001");
        pendingInvoice.setReferenceCode("PAYABC12345");
        pendingInvoice.setTotalAmount(new BigDecimal("500000"));
        pendingInvoice.setStatus(InvoiceStatus.PENDING);
        pendingInvoice.setCreatedBy(creator);
        pendingInvoice.setExpiresAt(LocalDateTime.now().plusHours(1));
    }

    private PaymentWebhookRequest buildRequest(Long id, String content, String transferType, BigDecimal amount) {
        PaymentWebhookRequest req = new PaymentWebhookRequest();
        req.setId(id);
        req.setGateway("MB");
        req.setTransactionDate(LocalDateTime.now());
        req.setAccountNumber("0123456789");
        req.setContent(content);
        req.setTransferType(transferType);
        req.setTransferAmount(amount);
        req.setReferenceCode("BANKREF001");
        return req;
    }

    // ---------------------------------------------------------------
    // TC-18: Webhook hợp lệ – số tiền đúng → bản ghi SUCCESS, phiếu PAID
    // ---------------------------------------------------------------
    @Test
    @DisplayName("TC-18: Webhook hợp lệ, đúng số tiền → PaymentStatus.SUCCESS, gọi markAsPaid")
    void tc18_processPayment_validWebhook_shouldCreateSuccessRecord() {
        PaymentWebhookRequest req = buildRequest(9001L,
                "PAYABC12345 INV202606240001", "in", new BigDecimal("500000"));

        when(paymentRepository.findByTransactionId(9001L)).thenReturn(Optional.empty());
        when(invoiceRepository.findByReferenceCode("PAYABC12345")).thenReturn(Optional.of(pendingInvoice));

        PaymentEntity savedPayment = new PaymentEntity();
        savedPayment.setId(100L);
        savedPayment.setStatus(PaymentStatus.SUCCESS);
        savedPayment.setAmount(new BigDecimal("500000"));
        savedPayment.setTransactionCode("AUTO-9001-INV202606240001");
        when(paymentRepository.save(any(PaymentEntity.class))).thenReturn(savedPayment);

        PaymentEntity result = paymentService.processPayment(req);

        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo(PaymentStatus.SUCCESS);
        verify(invoiceService).markAsPaid(pendingInvoice.getId());
    }

    // ---------------------------------------------------------------
    // TC-19: Webhook – số tiền thấp hơn → bản ghi FAILED/AMOUNT_TOO_LOW
    // ---------------------------------------------------------------
    @Test
    @DisplayName("TC-19: Webhook số tiền thấp hơn tổng → PaymentStatus.FAILED, reason=AMOUNT_TOO_LOW")
    void tc19_processPayment_amountTooLow_shouldCreateFailedRecord() {
        PaymentWebhookRequest req = buildRequest(9002L,
                "PAYABC12345 INV202606240001", "in", new BigDecimal("100000"));

        when(paymentRepository.findByTransactionId(9002L)).thenReturn(Optional.empty());
        when(invoiceRepository.findByReferenceCode("PAYABC12345")).thenReturn(Optional.of(pendingInvoice));

        PaymentEntity failedPayment = new PaymentEntity();
        failedPayment.setId(101L);
        failedPayment.setStatus(PaymentStatus.FAILED);
        failedPayment.setFailureReason(PaymentFailureReason.AMOUNT_TOO_LOW);
        when(paymentRepository.save(any(PaymentEntity.class))).thenReturn(failedPayment);

        PaymentEntity result = paymentService.processPayment(req);

        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo(PaymentStatus.FAILED);
        assertThat(result.getFailureReason()).isEqualTo(PaymentFailureReason.AMOUNT_TOO_LOW);
        verify(invoiceService, never()).markAsPaid(any());
    }

    // ---------------------------------------------------------------
    // TC-19b: Webhook – số tiền cao hơn → bản ghi FAILED/AMOUNT_TOO_HIGH
    // ---------------------------------------------------------------
    @Test
    @DisplayName("TC-19b: Webhook số tiền cao hơn tổng → FAILED, reason=AMOUNT_TOO_HIGH")
    void tc19b_processPayment_amountTooHigh_shouldCreateFailedRecord() {
        PaymentWebhookRequest req = buildRequest(9003L,
                "PAYABC12345 INV202606240001", "in", new BigDecimal("999999"));

        when(paymentRepository.findByTransactionId(9003L)).thenReturn(Optional.empty());
        when(invoiceRepository.findByReferenceCode("PAYABC12345")).thenReturn(Optional.of(pendingInvoice));

        PaymentEntity failedPayment = new PaymentEntity();
        failedPayment.setId(102L);
        failedPayment.setStatus(PaymentStatus.FAILED);
        failedPayment.setFailureReason(PaymentFailureReason.AMOUNT_TOO_HIGH);
        when(paymentRepository.save(any(PaymentEntity.class))).thenReturn(failedPayment);

        PaymentEntity result = paymentService.processPayment(req);

        assertThat(result.getFailureReason()).isEqualTo(PaymentFailureReason.AMOUNT_TOO_HIGH);
        verify(invoiceService, never()).markAsPaid(any());
    }

    // ---------------------------------------------------------------
    // TC-20: Webhook trùng transactionId → không tạo bản ghi mới
    // ---------------------------------------------------------------
    @Test
    @DisplayName("TC-20: Webhook trùng transactionId – trả bản ghi cũ, không xử lý lại")
    void tc20_processPayment_duplicateTransactionId_shouldReturnExisting() {
        PaymentWebhookRequest req = buildRequest(9001L,
                "PAYABC12345 INV202606240001", "in", new BigDecimal("500000"));

        PaymentEntity existingPayment = new PaymentEntity();
        existingPayment.setId(100L);
        existingPayment.setStatus(PaymentStatus.SUCCESS);
        when(paymentRepository.findByTransactionId(9001L)).thenReturn(Optional.of(existingPayment));

        PaymentEntity result = paymentService.processPayment(req);

        assertThat(result.getId()).isEqualTo(100L);
        verify(paymentRepository, never()).save(any());
        verify(invoiceService, never()).markAsPaid(any());
    }

    // ---------------------------------------------------------------
    // Kiểm thử: Webhook giao dịch outgoing → bỏ qua (trả null)
    // ---------------------------------------------------------------
    @Test
    @DisplayName("Webhook chuyển khoản đi (transferType=out) – bỏ qua, trả null")
    void processPayment_outgoingTransfer_shouldReturnNull() {
        PaymentWebhookRequest req = buildRequest(9005L,
                "PAYABC12345 INV202606240001", "out", new BigDecimal("500000"));

        PaymentEntity result = paymentService.processPayment(req);

        assertThat(result).isNull();
        verify(paymentRepository, never()).findByTransactionId(any());
        verify(paymentRepository, never()).save(any());
    }

    // ---------------------------------------------------------------
    // Kiểm thử: Nội dung chuyển khoản không khớp định dạng → INVALID_REFERENCE
    // ---------------------------------------------------------------
    @Test
    @DisplayName("Nội dung chuyển khoản sai định dạng → FAILED, reason=INVALID_REFERENCE")
    void processPayment_invalidContentFormat_shouldCreateFailedRecord() {
        PaymentWebhookRequest req = buildRequest(9006L,
                "chuyentien thang 6", "in", new BigDecimal("500000"));

        when(paymentRepository.findByTransactionId(9006L)).thenReturn(Optional.empty());

        PaymentEntity failedPayment = new PaymentEntity();
        failedPayment.setStatus(PaymentStatus.FAILED);
        failedPayment.setFailureReason(PaymentFailureReason.INVALID_REFERENCE);
        when(paymentRepository.save(any(PaymentEntity.class))).thenReturn(failedPayment);

        PaymentEntity result = paymentService.processPayment(req);

        assertThat(result.getFailureReason()).isEqualTo(PaymentFailureReason.INVALID_REFERENCE);
        verify(invoiceService, never()).markAsPaid(any());
    }

    // ---------------------------------------------------------------
    // Kiểm thử: Phiếu thanh toán đã hết hạn → FAILED/INVOICE_EXPIRED
    // ---------------------------------------------------------------
    @Test
    @DisplayName("Phiếu thanh toán đã EXPIRED → FAILED, reason=INVOICE_EXPIRED")
    void processPayment_expiredInvoice_shouldCreateFailedRecord() {
        pendingInvoice.setStatus(InvoiceStatus.EXPIRED);
        PaymentWebhookRequest req = buildRequest(9007L,
                "PAYABC12345 INV202606240001", "in", new BigDecimal("500000"));

        when(paymentRepository.findByTransactionId(9007L)).thenReturn(Optional.empty());
        when(invoiceRepository.findByReferenceCode("PAYABC12345")).thenReturn(Optional.of(pendingInvoice));

        PaymentEntity failedPayment = new PaymentEntity();
        failedPayment.setStatus(PaymentStatus.FAILED);
        failedPayment.setFailureReason(PaymentFailureReason.INVOICE_EXPIRED);
        when(paymentRepository.save(any(PaymentEntity.class))).thenReturn(failedPayment);

        PaymentEntity result = paymentService.processPayment(req);

        assertThat(result.getFailureReason()).isEqualTo(PaymentFailureReason.INVOICE_EXPIRED);
        verify(invoiceService, never()).markAsPaid(any());
    }
}
