package com.bluemoon.backend.service.apartment;

import com.bluemoon.backend.dtos.request.apartment.ApartmentRequest;
import com.bluemoon.backend.entity.apartment.ApartmentEntity;
import com.bluemoon.backend.entity.auth.UserEntity;
import com.bluemoon.backend.enums.apartment.ApartmentStatus;
import com.bluemoon.backend.enums.apartment.ApartmentType;
import com.bluemoon.backend.enums.apartment.ResidentStatus;
import com.bluemoon.backend.exceptions.InvalidOperationException;
import com.bluemoon.backend.exceptions.ResourceNotFoundException;
import com.bluemoon.backend.mapper.apartment.ApartmentMapper;
import com.bluemoon.backend.repository.apartment.ApartmentRepository;
import com.bluemoon.backend.repository.auth.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.eq;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests cho ApartmentService – TC-05, TC-06, TC-07, TC-09, TC-10
 * Kiểm thử nghiệp vụ quản lý căn hộ: tạo, trùng số căn, xóa có cư dân.
 */
@ExtendWith(MockitoExtension.class)
class ApartmentServiceTest {

    @Mock private ApartmentRepository apartmentRepository;
    @Mock private UserRepository userRepository;
    @Mock private ApartmentMapper apartmentMapper;

    @InjectMocks
    private ApartmentService apartmentService;

    private ApartmentEntity apartment101;

    @BeforeEach
    void setUp() {
        apartment101 = new ApartmentEntity();
        apartment101.setId(1L);
        apartment101.setApartmentNumber("101");
        apartment101.setFloor(1);
        apartment101.setArea(65.0);
        apartment101.setType(ApartmentType.TWO_BEDROOM);
        apartment101.setStatus(ApartmentStatus.VACANT);
    }

    // ---------------------------------------------------------------
    // TC-05: Tạo căn hộ mới – lưu trạng thái VACANT
    // ---------------------------------------------------------------
    @Test
    @DisplayName("TC-05: Tạo căn hộ mới với số căn chưa tồn tại → lưu thành công, status=VACANT")
    void tc05_createApartment_newNumber_shouldSaveWithVacantStatus() {
        ApartmentRequest request = new ApartmentRequest();
        request.setNumber("102");

        when(apartmentRepository.findByApartmentNumber("102")).thenReturn(Optional.empty());
        when(apartmentMapper.toEntity(request)).thenReturn(new ApartmentEntity());

        ApartmentEntity savedApartment = new ApartmentEntity();
        savedApartment.setApartmentNumber("102");
        savedApartment.setStatus(ApartmentStatus.VACANT);
        when(apartmentRepository.save(any(ApartmentEntity.class))).thenReturn(savedApartment);

        ApartmentEntity result = apartmentService.createApartment(request);

        assertThat(result.getStatus()).isEqualTo(ApartmentStatus.VACANT);
        verify(apartmentRepository).save(any(ApartmentEntity.class));
    }

    // ---------------------------------------------------------------
    // TC-06: Tạo căn hộ với số căn đã tồn tại → ném lỗi
    // ---------------------------------------------------------------
    @Test
    @DisplayName("TC-06: Tạo căn hộ trùng số căn → ném InvalidOperationException")
    void tc06_createApartment_duplicateNumber_shouldThrow() {
        ApartmentRequest request = new ApartmentRequest();
        request.setNumber("101");

        when(apartmentRepository.findByApartmentNumber("101")).thenReturn(Optional.of(apartment101));

        assertThatThrownBy(() -> apartmentService.createApartment(request))
                .isInstanceOf(InvalidOperationException.class)
                .hasMessageContaining("already exists");

        verify(apartmentRepository, never()).save(any());
    }

    // ---------------------------------------------------------------
    // TC-07: Xóa căn hộ còn cư dân → ném lỗi
    // ---------------------------------------------------------------
    @Test
    @DisplayName("TC-07: Xóa căn hộ còn cư dân → ném InvalidOperationException")
    void tc07_deleteApartment_withResidents_shouldThrow() {
        when(apartmentRepository.findById(1L)).thenReturn(Optional.of(apartment101));
        when(apartmentRepository.countUsersByApartmentId(1L)).thenReturn(2L);

        assertThatThrownBy(() -> apartmentService.deleteApartment(1L))
                .isInstanceOf(InvalidOperationException.class)
                .hasMessageContaining("still contains users");

        verify(apartmentRepository, never()).delete(any(ApartmentEntity.class));
    }

    // ---------------------------------------------------------------
    // TC-07b: Xóa căn hộ không còn cư dân → thành công
    // ---------------------------------------------------------------
    @Test
    @DisplayName("TC-07b: Xóa căn hộ không còn cư dân → xóa thành công")
    void deleteApartment_noResidents_shouldSucceed() {
        when(apartmentRepository.findById(1L)).thenReturn(Optional.of(apartment101));
        when(apartmentRepository.countUsersByApartmentId(1L)).thenReturn(0L);

        apartmentService.deleteApartment(1L);

        verify(apartmentRepository).delete(apartment101);
    }

    // ---------------------------------------------------------------
    // TC-09: Cư dân xem căn hộ của mình
    // ---------------------------------------------------------------
    @Test
    @DisplayName("TC-09: Lấy căn hộ của người dùng đã liên kết → trả căn hộ đúng")
    void tc09_getApartmentForUser_assignedResident_shouldReturnApartment() {
        UserEntity user = new UserEntity();
        user.setId(5L);
        user.setUsername("resident01");
        user.setApartment(apartment101);

        when(userRepository.findByUsername("resident01")).thenReturn(Optional.of(user));

        ApartmentEntity result = apartmentService.getApartmentForUser("resident01");

        assertThat(result.getApartmentNumber()).isEqualTo("101");
    }

    // ---------------------------------------------------------------
    // TC-10: Cư dân chưa gắn căn hộ xem trang → ném lỗi
    // ---------------------------------------------------------------
    @Test
    @DisplayName("TC-10: Cư dân chưa liên kết căn hộ → ném InvalidOperationException")
    void tc10_getApartmentForUser_unassignedResident_shouldThrow() {
        UserEntity user = new UserEntity();
        user.setId(6L);
        user.setUsername("resident02");
        user.setApartment(null);

        when(userRepository.findByUsername("resident02")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> apartmentService.getApartmentForUser("resident02"))
                .isInstanceOf(InvalidOperationException.class)
                .hasMessageContaining("not assigned to any apartment");
    }

    // ---------------------------------------------------------------
    // Kiểm thử: Tự động cập nhật trạng thái căn hộ theo số cư dân
    // ---------------------------------------------------------------
    @Test
    @DisplayName("Cập nhật status căn hộ: 0 cư dân active → VACANT")
    void updateApartmentStatus_noActiveResidents_shouldSetVacant() {
        when(apartmentRepository.findById(1L)).thenReturn(Optional.of(apartment101));
        when(apartmentRepository.countActiveUsersByApartmentId(eq(1L), any())).thenReturn(0L);

        apartmentService.updateApartmentStatusByUserCount(1L);

        assertThat(apartment101.getStatus()).isEqualTo(ApartmentStatus.VACANT);
        verify(apartmentRepository).save(apartment101);
    }

    @Test
    @DisplayName("Cập nhật status căn hộ: có cư dân active → OCCUPIED")
    void updateApartmentStatus_withActiveResidents_shouldSetOccupied() {
        when(apartmentRepository.findById(1L)).thenReturn(Optional.of(apartment101));
        when(apartmentRepository.countActiveUsersByApartmentId(eq(1L), any())).thenReturn(3L);

        apartmentService.updateApartmentStatusByUserCount(1L);

        assertThat(apartment101.getStatus()).isEqualTo(ApartmentStatus.OCCUPIED);
        verify(apartmentRepository).save(apartment101);
    }

    // ---------------------------------------------------------------
    // Kiểm thử: Lấy căn hộ theo ID không tồn tại
    // ---------------------------------------------------------------
    @Test
    @DisplayName("Lấy căn hộ theo ID không tồn tại → ResourceNotFoundException")
    void getApartmentById_notFound_shouldThrow() {
        when(apartmentRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> apartmentService.getApartmentById(999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("999");
    }
}
