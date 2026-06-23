package com.bluemoon.backend.service.auth;

import com.bluemoon.backend.dtos.response.auth.LoginResponse;
import com.bluemoon.backend.entity.auth.PasswordResetToken;
import com.bluemoon.backend.entity.auth.UserEntity;
import com.bluemoon.backend.enums.auth.UserRole;
import com.bluemoon.backend.exceptions.InvalidCredentialsException;
import com.bluemoon.backend.exceptions.ResourceNotFoundException;
import com.bluemoon.backend.repository.auth.OtpVerificationTokenRepository;
import com.bluemoon.backend.repository.auth.PasswordResetTokenRepository;
import com.bluemoon.backend.repository.auth.UserRepository;
import com.bluemoon.backend.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests cho AuthService – TC-01, TC-02, TC-04
 * Kiểm thử mức đơn vị: mock tất cả dependency.
 */
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordResetTokenRepository passwordResetTokenRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtUtil jwtUtil;
    @Mock private OtpService otpService;
    @Mock private EmailService emailService;
    // GoogleIdTokenVerifier is only used for loginWithGoogle – not needed for these tests
    @Mock private com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier googleIdTokenVerifier;

    @InjectMocks
    private AuthService authService;

    private UserEntity mockUser;

    @BeforeEach
    void setUp() {
        mockUser = new UserEntity();
        mockUser.setId(1L);
        mockUser.setUsername("resident01");
        mockUser.setPassword("$2a$10$encryptedPassword");
        mockUser.setFullName("Nguyễn Hoàng Gia");
        mockUser.setRole(UserRole.USER);
        mockUser.setVerified(true);
    }

    // ---------------------------------------------------------------
    // TC-01: Đăng nhập thành công với tài khoản/mật khẩu đúng
    // ---------------------------------------------------------------
    @Test
    @DisplayName("TC-01: Đăng nhập nội bộ thành công – nhận JWT và đúng vai trò")
    void tc01_login_withValidCredentials_shouldReturnJwt() {
        when(userRepository.findByUsername("resident01")).thenReturn(Optional.of(mockUser));
        when(passwordEncoder.matches("correctPass", mockUser.getPassword())).thenReturn(true);
        when(jwtUtil.generateToken("resident01", "USER")).thenReturn("mock.jwt.token");

        LoginResponse response = authService.login("resident01", "correctPass");

        assertThat(response).isNotNull();
        assertThat(response.getToken()).isEqualTo("mock.jwt.token");
        assertThat(response.getRole()).isEqualTo(UserRole.USER);
        assertThat(response.getUsername()).isEqualTo("resident01");
        verify(jwtUtil).generateToken("resident01", "USER");
    }

    // ---------------------------------------------------------------
    // TC-02: Đăng nhập với mật khẩu sai → trả lỗi, không lưu token
    // ---------------------------------------------------------------
    @Test
    @DisplayName("TC-02: Sai mật khẩu – ném InvalidCredentialsException, không sinh token")
    void tc02_login_withWrongPassword_shouldThrowInvalidCredentials() {
        when(userRepository.findByUsername("resident01")).thenReturn(Optional.of(mockUser));
        when(passwordEncoder.matches("wrongPass", mockUser.getPassword())).thenReturn(false);

        assertThatThrownBy(() -> authService.login("resident01", "wrongPass"))
                .isInstanceOf(InvalidCredentialsException.class)
                .hasMessageContaining("Invalid username or password");

        verify(jwtUtil, never()).generateToken(anyString(), anyString());
    }

    // ---------------------------------------------------------------
    // TC-01b: Đăng nhập với tên đăng nhập không tồn tại
    // ---------------------------------------------------------------
    @Test
    @DisplayName("TC-01b: Tên đăng nhập không tồn tại – ném InvalidCredentialsException")
    void login_withNonExistentUsername_shouldThrowInvalidCredentials() {
        when(userRepository.findByUsername("unknown")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login("unknown", "anyPass"))
                .isInstanceOf(InvalidCredentialsException.class);

        verify(passwordEncoder, never()).matches(anyString(), anyString());
    }

    // ---------------------------------------------------------------
    // TC-04a: requestForgotPassword – email không tồn tại → ném lỗi
    // ---------------------------------------------------------------
    @Test
    @DisplayName("TC-04a: Quên mật khẩu – email không tồn tại → ResourceNotFoundException")
    void tc04a_requestForgotPassword_emailNotFound_shouldThrow() {
        when(userRepository.findByEmail("notexist@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.requestForgotPassword("notexist@example.com"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Email not found");
    }

    // ---------------------------------------------------------------
    // TC-04b: resetPassword – token hết hạn → ném lỗi
    // ---------------------------------------------------------------
    @Test
    @DisplayName("TC-04b: Đặt lại mật khẩu với token hết hạn – ném InvalidCredentialsException")
    void tc04b_resetPassword_withExpiredToken_shouldThrow() {
        PasswordResetToken expiredToken = mock(PasswordResetToken.class);
        when(expiredToken.isExpired()).thenReturn(true);
        when(passwordResetTokenRepository.findByToken("expired-uuid")).thenReturn(Optional.of(expiredToken));

        assertThatThrownBy(() -> authService.resetPassword("expired-uuid", "newPass123"))
                .isInstanceOf(InvalidCredentialsException.class)
                .hasMessageContaining("expired");

        verify(userRepository, never()).save(any());
    }

    // ---------------------------------------------------------------
    // TC-04c: resetPassword – token hợp lệ → lưu mật khẩu mới
    // ---------------------------------------------------------------
    @Test
    @DisplayName("TC-04c: Đặt lại mật khẩu với token hợp lệ – lưu mật khẩu mới thành công")
    void tc04c_resetPassword_withValidToken_shouldUpdatePassword() {
        PasswordResetToken validToken = mock(PasswordResetToken.class);
        when(validToken.isExpired()).thenReturn(false);
        when(validToken.getUser()).thenReturn(mockUser);
        when(passwordResetTokenRepository.findByToken("valid-uuid")).thenReturn(Optional.of(validToken));
        when(passwordEncoder.encode("newSecurePass")).thenReturn("$2a$10$newEncrypted");

        authService.resetPassword("valid-uuid", "newSecurePass");

        assertThat(mockUser.getPassword()).isEqualTo("$2a$10$newEncrypted");
        verify(userRepository).save(mockUser);
        verify(passwordResetTokenRepository).delete(validToken);
    }
}
