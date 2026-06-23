package com.bluemoon.backend.controller.auth;

import com.bluemoon.backend.entity.auth.UserEntity;
import com.bluemoon.backend.enums.auth.UserRole;
import com.bluemoon.backend.repository.auth.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class AuthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
        
        UserEntity admin = new UserEntity();
        admin.setUsername("admin_test");
        admin.setPassword(passwordEncoder.encode("password123"));
        admin.setEmail("admin@test.com");
        admin.setRole(UserRole.ADMIN);
        admin.setVerified(true);
        userRepository.save(admin);
    }

    @Test
    @DisplayName("Đăng nhập thành công với thông tin hợp lệ -> Trả về 200 OK và JWT Token")
    void login_ValidCredentials_Returns200AndToken() throws Exception {
        String loginPayload = """
                {
                    "username": "admin_test",
                    "password": "password123"
                }
                """;

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.username").value("admin_test"))
                .andExpect(jsonPath("$.user.role").value("ADMIN"));
    }

    @Test
    @DisplayName("Đăng nhập thất bại với sai mật khẩu -> Trả về 401 Unauthorized")
    void login_InvalidPassword_Returns401() throws Exception {
        String loginPayload = """
                {
                    "username": "admin_test",
                    "password": "wrongpassword"
                }
                """;

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginPayload))
                .andExpect(status().isUnauthorized());
    }
}
