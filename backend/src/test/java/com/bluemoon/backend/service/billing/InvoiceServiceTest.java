package com.bluemoon.backend.service.billing;

import com.bluemoon.backend.config.SepayConfig;
import com.bluemoon.backend.entity.apartment.ApartmentEntity;
import com.bluemoon.backend.entity.auth.UserEntity;
import com.bluemoon.backend.entity.billing.BillEntity;
import com.bluemoon.backend.entity.billing.InvoiceBillSnapshotEntity;
import com.bluemoon.backend.entity.billing.InvoiceEntity;
import com.bluemoon.backend.enums.billing.BillStatus;
import com.bluemoon.backend.enums.billing.InvoiceStatus;
import com.bluemoon.backend.enums.billing.InvoiceType;
import com.bluemoon.backend.exceptions.InvalidOperationException;
import com.bluemoon.backend.repository.billing.BillRepository;
import com.bluemoon.backend.repository.billing.InvoiceBillSnapshotRepository;
import com.bluemoon.backend.repository.billing.InvoiceRepository;
import com.bluemoon.backend.repository.auth.UserRepository;
import com.bluemoon.backend.repository.contribution.ApartmentContributionRepository;
import com.bluemoon.backend.service.communication.NotificationService;
import com.bluemoon.backend.service.contribution.ApartmentContributionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests cho InvoiceService – TC-15, TC-16, TC-17
 * Kiểm thử nghiệp vụ: tạo phiếu thanh toán, validation hóa đơn,
 * hủy phiếu và giải phóng hóa đơn.
 */
@ExtendWith(MockitoExtension.class)
class InvoiceServiceTest {

    @Mock private InvoiceRepository invoiceRepository;
    @Mock private BillRepository billRepository;
    @Mock private InvoiceBillSnapshotRepository snapshotRepository;
    @Mock private UserRepository userRepository;
    @Mock private QrCodeService qrCodeService;
    @Mock private SepayConfig sepayConfig;
    @Mock private NotificationService notificationService;
    @Mock private ApartmentContributionRepository apartmentContributionRepository;
    @Mock private ApartmentContributionService apartmentContributionService;

    @InjectMocks
    private InvoiceService invoiceService;

    private ApartmentEntity apartment;
    private UserEntity resident;
    private BillEntity unpaidBill1;
    private BillEntity unpaidBill2;
    private InvoiceEntity pendingInvoice;

    @BeforeEach
    void setUp() {
        apartment = new ApartmentEntity();
        apartment.setId(1L);
        apartment.setApartmentNumber("101");

        resident = new UserEntity();
        resident.setId(10L);
        resident.setUsername("resident01");
        resident.setFullName("Nguyễn Hoàng Gia");
        resident.setApartment(apartment);

        unpaidBill1 = new BillEntity();
        unpaidBill1.setId(1L);
        unpaidBill1.setTitle("Phí quản lý tháng 6");
        unpaidBill1.setAmount(new BigDecimal("300000"));
        unpaidBill1.setStatus(BillStatus.UNPAID);
        unpaidBill1.setApartment(apartment);
        unpaidBill1.setInvoiceId(null);

        unpaidBill2 = new BillEntity();
        unpaidBill2.setId(2L);
        unpaidBill2.setTitle("Phí giữ xe tháng 6");
        unpaidBill2.setAmount(new BigDecimal("200000"));
        unpaidBill2.setStatus(BillStatus.UNPAID);
        unpaidBill2.setApartment(apartment);
        unpaidBill2.setInvoiceId(null);

        pendingInvoice = new InvoiceEntity();
        pendingInvoice.setId(100L);
        pendingInvoice.setInvoiceCode("INV202406240001");
        pendingInvoice.setReferenceCode("PAYABC12345");
        pendingInvoice.setInvoiceType(InvoiceType.BILL);
        pendingInvoice.setTotalAmount(new BigDecimal("500000"));
        pendingInvoice.setStatus(InvoiceStatus.PENDING);
        pendingInvoice.setCreatedBy(resident);
        pendingInvoice.setExpiresAt(LocalDateTime.now().plusHours(1));
    }

    // ---------------------------------------------------------------
    // TC-15: Tạo phiếu thanh toán hóa đơn – hóa đơn hợp lệ
    // ---------------------------------------------------------------
    @Test
    @DisplayName("TC-15: Tạo phiếu thanh toán – hóa đơn hợp lệ, cùng căn hộ → PENDING, bills bị khóa")
    void tc15_createInvoice_validBills_shouldCreatePendingInvoice() {
        when(userRepository.findById(10L)).thenReturn(Optional.of(resident));
        when(billRepository.findAllById(List.of(1L, 2L))).thenReturn(List.of(unpaidBill1, unpaidBill2));
        when(sepayConfig.getInvoiceExpirationMinutes()).thenReturn(30);
        when(qrCodeService.generateQrCodeUrl(any())).thenReturn("https://qr.sepay.vn/img?acc=xxx");

        InvoiceEntity savedInvoice = new InvoiceEntity();
        savedInvoice.setId(100L);
        savedInvoice.setInvoiceCode("INV202406240001");
        savedInvoice.setReferenceCode("PAYABC12345");
        savedInvoice.setTotalAmount(new BigDecimal("500000"));
        savedInvoice.setStatus(InvoiceStatus.PENDING);
        savedInvoice.setCreatedBy(resident);
        savedInvoice.setExpiresAt(LocalDateTime.now().plusMinutes(30));
        savedInvoice.setQrCodeUrl("https://qr.sepay.vn/img?acc=xxx");
        when(invoiceRepository.save(any())).thenReturn(savedInvoice);
        doReturn(0L).when(invoiceRepository).countInvoicesCreatedSince(any());
        when(invoiceRepository.existsByInvoiceCode(any())).thenReturn(false);
        when(invoiceRepository.existsByReferenceCode(any())).thenReturn(false);

        var response = invoiceService.createInvoice(List.of(1L, 2L), 10L);

        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo(InvoiceStatus.PENDING);
        assertThat(response.getTotalAmount()).isEqualByComparingTo(new BigDecimal("500000"));
        verify(billRepository, atLeastOnce()).save(any(BillEntity.class));
        verify(snapshotRepository, times(2)).save(any(InvoiceBillSnapshotEntity.class));
    }

    // ---------------------------------------------------------------
    // TC-16: Hóa đơn từ nhiều căn hộ → ném lỗi
    // ---------------------------------------------------------------
    @Test
    @DisplayName("TC-16: Hóa đơn của các căn hộ khác nhau → ném InvalidOperationException")
    void tc16_createInvoice_billsFromDifferentApartments_shouldThrow() {
        ApartmentEntity apartment2 = new ApartmentEntity();
        apartment2.setId(2L);
        apartment2.setApartmentNumber("202");

        BillEntity billFromOtherApartment = new BillEntity();
        billFromOtherApartment.setId(3L);
        billFromOtherApartment.setTitle("Hóa đơn căn hộ 202");
        billFromOtherApartment.setAmount(new BigDecimal("150000"));
        billFromOtherApartment.setStatus(BillStatus.UNPAID);
        billFromOtherApartment.setApartment(apartment2);
        billFromOtherApartment.setInvoiceId(null);

        when(userRepository.findById(10L)).thenReturn(Optional.of(resident));
        when(billRepository.findAllById(List.of(1L, 3L)))
                .thenReturn(List.of(unpaidBill1, billFromOtherApartment));

        assertThatThrownBy(() -> invoiceService.createInvoice(List.of(1L, 3L), 10L))
                .isInstanceOf(InvalidOperationException.class)
                .hasMessageContaining("same apartment");
    }

    // ---------------------------------------------------------------
    // TC-16b: Hóa đơn đã thanh toán → ném lỗi
    // ---------------------------------------------------------------
    @Test
    @DisplayName("TC-16b: Hóa đơn đã PAID trong danh sách → ném InvalidOperationException")
    void createInvoice_withPaidBill_shouldThrow() {
        BillEntity paidBill = new BillEntity();
        paidBill.setId(5L);
        paidBill.setTitle("Hóa đơn đã thanh toán");
        paidBill.setAmount(new BigDecimal("300000"));
        paidBill.setStatus(BillStatus.PAID);
        paidBill.setApartment(apartment);

        when(userRepository.findById(10L)).thenReturn(Optional.of(resident));
        when(billRepository.findAllById(List.of(5L))).thenReturn(List.of(paidBill));

        assertThatThrownBy(() -> invoiceService.createInvoice(List.of(5L), 10L))
                .isInstanceOf(InvalidOperationException.class)
                .hasMessageContaining("not eligible");
    }

    // ---------------------------------------------------------------
    // TC-16c: Hóa đơn đang khóa bởi phiếu thanh toán khác → ném lỗi
    // ---------------------------------------------------------------
    @Test
    @DisplayName("TC-16c: Hóa đơn đã bị khóa bởi phiếu khác → ném InvalidOperationException")
    void createInvoice_billLockedByAnotherInvoice_shouldThrow() {
        unpaidBill1.setInvoiceId(999L); // đã bị khóa bởi phiếu 999

        when(userRepository.findById(10L)).thenReturn(Optional.of(resident));
        when(billRepository.findAllById(List.of(1L))).thenReturn(List.of(unpaidBill1));

        assertThatThrownBy(() -> invoiceService.createInvoice(List.of(1L), 10L))
                .isInstanceOf(InvalidOperationException.class)
                .hasMessageContaining("active invoice");
    }

    // ---------------------------------------------------------------
    // TC-17: Hủy phiếu thanh toán PENDING → CANCELLED, giải phóng hóa đơn
    // ---------------------------------------------------------------
    @Test
    @DisplayName("TC-17: Hủy phiếu thanh toán PENDING → status=CANCELLED, hóa đơn được mở khóa")
    void tc17_cancelInvoice_pendingByCreator_shouldCancelAndReleaseBills() {
        when(invoiceRepository.findById(100L)).thenReturn(Optional.of(pendingInvoice));

        // bills locked to this invoice
        unpaidBill1.setInvoiceId(100L);
        unpaidBill2.setInvoiceId(100L);

        InvoiceBillSnapshotEntity snap1 = new InvoiceBillSnapshotEntity(100L, 1L);
        InvoiceBillSnapshotEntity snap2 = new InvoiceBillSnapshotEntity(100L, 2L);
        when(snapshotRepository.findByInvoiceId(100L)).thenReturn(List.of(snap1, snap2));
        when(billRepository.findAllById(List.of(1L, 2L))).thenReturn(List.of(unpaidBill1, unpaidBill2));

        invoiceService.cancelInvoice(100L, 10L);

        assertThat(pendingInvoice.getStatus()).isEqualTo(InvoiceStatus.CANCELLED);
        assertThat(pendingInvoice.getCancelledAt()).isNotNull();
        // Bills should be released (invoiceId = null)
        assertThat(unpaidBill1.getInvoiceId()).isNull();
        assertThat(unpaidBill2.getInvoiceId()).isNull();
        verify(invoiceRepository).save(pendingInvoice);
    }

    // ---------------------------------------------------------------
    // TC-17b: Hủy phiếu không ở trạng thái PENDING → ném lỗi
    // ---------------------------------------------------------------
    @Test
    @DisplayName("TC-17b: Hủy phiếu đã PAID → ném InvalidOperationException")
    void cancelInvoice_notPending_shouldThrow() {
        pendingInvoice.setStatus(InvoiceStatus.PAID);
        when(invoiceRepository.findById(100L)).thenReturn(Optional.of(pendingInvoice));

        assertThatThrownBy(() -> invoiceService.cancelInvoice(100L, 10L))
                .isInstanceOf(InvalidOperationException.class)
                .hasMessageContaining("PENDING");
    }

    // ---------------------------------------------------------------
    // TC-17c: Hủy phiếu của người khác → ném lỗi
    // ---------------------------------------------------------------
    @Test
    @DisplayName("TC-17c: Cư dân khác cố hủy phiếu → ném InvalidOperationException")
    void cancelInvoice_byNonCreator_shouldThrow() {
        when(invoiceRepository.findById(100L)).thenReturn(Optional.of(pendingInvoice));

        // userId=99 khác với creator=10
        assertThatThrownBy(() -> invoiceService.cancelInvoice(100L, 99L))
                .isInstanceOf(InvalidOperationException.class)
                .hasMessageContaining("creator");
    }

    // ---------------------------------------------------------------
    // Kiểm thử markAsPaid – phiếu BILL: các hóa đơn được đánh dấu PAID
    // ---------------------------------------------------------------
    @Test
    @DisplayName("markAsPaid – phiếu BILL → cập nhật invoice PAID và bills PAID")
    void markAsPaid_billInvoice_shouldMarkBillsAsPaid() {
        when(invoiceRepository.findById(100L)).thenReturn(Optional.of(pendingInvoice));

        unpaidBill1.setInvoiceId(100L);
        unpaidBill2.setInvoiceId(100L);
        InvoiceBillSnapshotEntity snap1 = new InvoiceBillSnapshotEntity(100L, 1L);
        InvoiceBillSnapshotEntity snap2 = new InvoiceBillSnapshotEntity(100L, 2L);
        when(snapshotRepository.findByInvoiceId(100L)).thenReturn(List.of(snap1, snap2));
        when(billRepository.findAllById(List.of(1L, 2L))).thenReturn(List.of(unpaidBill1, unpaidBill2));

        invoiceService.markAsPaid(100L);

        assertThat(pendingInvoice.getStatus()).isEqualTo(InvoiceStatus.PAID);
        assertThat(pendingInvoice.getPaidAt()).isNotNull();
        assertThat(unpaidBill1.getStatus()).isEqualTo(BillStatus.PAID);
        assertThat(unpaidBill2.getStatus()).isEqualTo(BillStatus.PAID);
    }
}
