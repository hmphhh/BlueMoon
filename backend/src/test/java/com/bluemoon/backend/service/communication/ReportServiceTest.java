package com.bluemoon.backend.service.communication;

import com.bluemoon.backend.dtos.request.communication.ReportRequest;
import com.bluemoon.backend.dtos.request.communication.ReviewReportRequest;
import com.bluemoon.backend.dtos.response.communication.ReportDetailsResponse;
import com.bluemoon.backend.dtos.response.communication.ReportSummaryResponse;
import com.bluemoon.backend.entity.auth.UserEntity;
import com.bluemoon.backend.entity.communication.ReportEntity;
import com.bluemoon.backend.enums.auth.UserRole;
import com.bluemoon.backend.enums.communication.ReportStatus;
import com.bluemoon.backend.exceptions.InvalidOperationException;
import com.bluemoon.backend.repository.auth.UserRepository;
import com.bluemoon.backend.repository.communication.ReportRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests cho ReportService – TC-23, TC-24
 * Kiểm thử luồng phản ánh: cư dân gửi, quản trị viên duyệt, phản ánh đã duyệt không thể sửa.
 */
@ExtendWith(MockitoExtension.class)
class ReportServiceTest {

    @Mock private ReportRepository reportRepository;
    @Mock private UserRepository userRepository;
    @Mock private NotificationService notificationService;

    @InjectMocks
    private ReportService reportService;

    private UserEntity resident;
    private UserEntity admin;
    private ReportEntity pendingReport;

    @BeforeEach
    void setUp() {
        resident = new UserEntity();
        resident.setId(5L);
        resident.setUsername("resident01");
        resident.setFullName("Nguyễn Hoàng Gia");
        resident.setRole(UserRole.USER);

        admin = new UserEntity();
        admin.setId(1L);
        admin.setUsername("admin01");
        admin.setFullName("Admin Hệ Thống");
        admin.setRole(UserRole.ADMIN);

        pendingReport = new ReportEntity();
        pendingReport.setId(10L);
        pendingReport.setTitle("Vòi nước bị hỏng");
        pendingReport.setContent("Vòi nước tầng 3 bị rò rỉ từ sáng nay.");
        pendingReport.setStatus(ReportStatus.PENDING);
        pendingReport.setCreatedBy(resident);
    }

    // ---------------------------------------------------------------
    // TC-23: Cư dân gửi phản ánh → lưu trạng thái PENDING
    // ---------------------------------------------------------------
    @Test
    @DisplayName("TC-23: Cư dân gửi phản ánh hợp lệ → lưu trạng thái PENDING, gửi thông báo admin")
    void tc23_createReport_validRequest_shouldSaveWithPendingStatus() {
        ReportRequest request = new ReportRequest();
        request.setTitle("Vòi nước bị hỏng");
        request.setContent("Vòi nước tầng 3 bị rò rỉ từ sáng nay.");

        when(userRepository.findByUsername("resident01")).thenReturn(Optional.of(resident));

        ReportEntity savedReport = new ReportEntity();
        savedReport.setId(10L);
        savedReport.setTitle(request.getTitle());
        savedReport.setStatus(ReportStatus.PENDING);
        savedReport.setCreatedBy(resident);
        when(reportRepository.save(any(ReportEntity.class))).thenReturn(savedReport);

        ReportSummaryResponse response = reportService.createReport("resident01", request);

        assertThat(response.getStatus()).isEqualTo(ReportStatus.PENDING);
        assertThat(response.getTitle()).isEqualTo("Vòi nước bị hỏng");
        verify(reportRepository).save(any(ReportEntity.class));
    }

    // ---------------------------------------------------------------
    // TC-24: Quản trị viên duyệt phản ánh PENDING → lưu trạng thái APPROVED
    // ---------------------------------------------------------------
    @Test
    @DisplayName("TC-24: Admin duyệt phản ánh PENDING → status=APPROVED, lưu reviewedBy và ghi chú")
    void tc24_reviewReport_approvePending_shouldSetApprovedStatus() {
        ReviewReportRequest request = new ReviewReportRequest();
        request.setStatus(ReportStatus.APPROVED);
        request.setReviewNote("Đã ghi nhận, sẽ sửa trong 24h.");

        when(reportRepository.findById(10L)).thenReturn(Optional.of(pendingReport));
        when(userRepository.findByUsername("admin01")).thenReturn(Optional.of(admin));
        when(reportRepository.save(any(ReportEntity.class))).thenReturn(pendingReport);

        ReportDetailsResponse response = reportService.reviewReport(10L, "admin01", request);

        assertThat(pendingReport.getStatus()).isEqualTo(ReportStatus.APPROVED);
        assertThat(pendingReport.getReviewedBy()).isEqualTo(admin);
        assertThat(pendingReport.getReviewNote()).isEqualTo("Đã ghi nhận, sẽ sửa trong 24h.");
        assertThat(pendingReport.getReviewedAt()).isNotNull();
    }

    // ---------------------------------------------------------------
    // TC-24b: Quản trị viên từ chối phản ánh PENDING → REJECTED
    // ---------------------------------------------------------------
    @Test
    @DisplayName("TC-24b: Admin từ chối phản ánh PENDING → status=REJECTED")
    void tc24b_reviewReport_rejectPending_shouldSetRejectedStatus() {
        ReviewReportRequest request = new ReviewReportRequest();
        request.setStatus(ReportStatus.REJECTED);
        request.setReviewNote("Không đủ thông tin để xử lý.");

        when(reportRepository.findById(10L)).thenReturn(Optional.of(pendingReport));
        when(userRepository.findByUsername("admin01")).thenReturn(Optional.of(admin));
        when(reportRepository.save(any(ReportEntity.class))).thenReturn(pendingReport);

        reportService.reviewReport(10L, "admin01", request);

        assertThat(pendingReport.getStatus()).isEqualTo(ReportStatus.REJECTED);
    }

    // ---------------------------------------------------------------
    // TC: Duyệt lại phản ánh đã được duyệt → ném lỗi
    // ---------------------------------------------------------------
    @Test
    @DisplayName("Duyệt phản ánh đã APPROVED → ném InvalidOperationException")
    void reviewReport_alreadyReviewed_shouldThrow() {
        pendingReport.setStatus(ReportStatus.APPROVED);
        ReviewReportRequest request = new ReviewReportRequest();
        request.setStatus(ReportStatus.REJECTED);

        when(reportRepository.findById(10L)).thenReturn(Optional.of(pendingReport));

        assertThatThrownBy(() -> reportService.reviewReport(10L, "admin01", request))
                .isInstanceOf(InvalidOperationException.class)
                .hasMessageContaining("already been reviewed");
    }

    // ---------------------------------------------------------------
    // TC: Cư dân sửa phản ánh đã duyệt → ném lỗi
    // ---------------------------------------------------------------
    @Test
    @DisplayName("Cư dân sửa phản ánh đã APPROVED → ném InvalidOperationException")
    void updateReport_approvedReport_shouldThrow() {
        pendingReport.setStatus(ReportStatus.APPROVED);
        ReportRequest request = new ReportRequest();
        request.setTitle("Tiêu đề mới");

        when(reportRepository.findById(10L)).thenReturn(Optional.of(pendingReport));
        when(userRepository.findByUsername("resident01")).thenReturn(Optional.of(resident));

        assertThatThrownBy(() -> reportService.updateReport(10L, "resident01", request))
                .isInstanceOf(InvalidOperationException.class)
                .hasMessageContaining("PENDING");
    }

    // ---------------------------------------------------------------
    // TC: Cư dân xóa phản ánh đã duyệt → ném lỗi
    // ---------------------------------------------------------------
    @Test
    @DisplayName("Cư dân xóa phản ánh đã APPROVED → ném InvalidOperationException")
    void deleteReport_approvedReport_shouldThrow() {
        pendingReport.setStatus(ReportStatus.APPROVED);

        when(reportRepository.findById(10L)).thenReturn(Optional.of(pendingReport));
        when(userRepository.findByUsername("resident01")).thenReturn(Optional.of(resident));

        assertThatThrownBy(() -> reportService.deleteReport(10L, "resident01"))
                .isInstanceOf(InvalidOperationException.class)
                .hasMessageContaining("PENDING");

        verify(reportRepository, never()).delete(any(ReportEntity.class));
    }

    // ---------------------------------------------------------------
    // TC-25: Cư dân xem phản ánh của người khác → ném lỗi
    // ---------------------------------------------------------------
    @Test
    @DisplayName("TC-25: Cư dân xem phản ánh của người khác → ném InvalidOperationException")
    void getReportDetails_anotherUsersReport_shouldThrow() {
        UserEntity anotherResident = new UserEntity();
        anotherResident.setId(99L);
        anotherResident.setUsername("resident99");
        anotherResident.setRole(UserRole.USER);

        // Report belongs to resident (id=5), but anotherResident (id=99) tries to access it
        when(reportRepository.findById(10L)).thenReturn(Optional.of(pendingReport));
        when(userRepository.findByUsername("resident99")).thenReturn(Optional.of(anotherResident));

        assertThatThrownBy(() ->
                reportService.getReportDetails(10L, "resident99", UserRole.USER))
                .isInstanceOf(InvalidOperationException.class)
                .hasMessageContaining("your own reports");
    }
}
