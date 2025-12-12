package com.wellkorea.backend.auth.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wellkorea.backend.BaseIntegrationTest;
import com.wellkorea.backend.auth.api.dto.LoginRequest;
import com.wellkorea.backend.auth.infrastructure.config.JwtTokenProvider;
import com.wellkorea.backend.shared.test.DatabaseTestHelper;
import com.wellkorea.backend.shared.test.TestFixtures;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Contract tests for /api/auth/login and /api/auth/logout endpoints.
 * Tests validate the authentication API contract as defined in OpenAPI spec.
 * <p>
 * Test-First Development: These tests MUST be written FIRST and MUST FAIL initially.
 * Per Constitution Principle I (Test-First Development).
 * <p>
 * T032: POST /api/auth/login - expects 200 with JWT on valid credentials, 401 on invalid
 * T033: POST /api/auth/logout - expects 200 on valid token, 401 on missing token
 */
@Tag("integration")
@AutoConfigureMockMvc
@Transactional
@DisplayName("Authentication Controller Contract Tests")
class AuthenticationControllerTest extends BaseIntegrationTest implements TestFixtures {

    private static final String LOGIN_URL = "/api/auth/login";
    private static final String LOGOUT_URL = "/api/auth/logout";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @BeforeEach
    void setUp() {
        // Insert test users with roles (password: TEST_PASSWORD)
        DatabaseTestHelper.insertTestUsersWithRoles(jdbcTemplate);
    }

    @Nested
    @DisplayName("POST /api/auth/login")
    class LoginTests {

        @Test
        @DisplayName("should return 200 with JWT token on valid credentials")
        void login_WithValidCredentials_Returns200WithToken() throws Exception {
            // Given
            LoginRequest request = new LoginRequest(ADMIN_USERNAME, TEST_PASSWORD);

            // When & Then
            mockMvc.perform(post(LOGIN_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
                    .andExpect(jsonPath("$.data.user.username").value(ADMIN_USERNAME))
                    .andExpect(jsonPath("$.data.user.roles", hasItem("ROLE_ADMIN")));
        }

        @Test
        @DisplayName("should return 401 on invalid password")
        void login_WithInvalidPassword_Returns401() throws Exception {
            // Given
            LoginRequest request = new LoginRequest(ADMIN_USERNAME, "wrongpassword");

            // When & Then
            mockMvc.perform(post(LOGIN_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnauthorized())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.errorCode").value("AUTH_001"));
        }

        @Test
        @DisplayName("should return 401 on non-existent user")
        void login_WithNonExistentUser_Returns401() throws Exception {
            // Given
            LoginRequest request = new LoginRequest("nonexistent", TEST_PASSWORD);

            // When & Then
            mockMvc.perform(post(LOGIN_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnauthorized())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.errorCode").value("AUTH_001"));
        }

        @Test
        @DisplayName("should return 400 on missing username")
        void login_WithMissingUsername_Returns400() throws Exception {
            // When & Then
            mockMvc.perform(post(LOGIN_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(LOGIN_REQUEST_MISSING_USERNAME))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 400 on missing password")
        void login_WithMissingPassword_Returns400() throws Exception {
            // When & Then
            mockMvc.perform(post(LOGIN_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(LOGIN_REQUEST_MISSING_PASSWORD))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 400 on empty username")
        void login_WithEmptyUsername_Returns400() throws Exception {
            // When & Then
            mockMvc.perform(post(LOGIN_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(LOGIN_REQUEST_EMPTY_USERNAME))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 401 on inactive user")
        void login_WithInactiveUser_Returns401() throws Exception {
            // Given - Deactivate user
            jdbcTemplate.update("UPDATE users SET is_active = false WHERE username = ?", FINANCE_USERNAME);
            LoginRequest request = new LoginRequest(FINANCE_USERNAME, TEST_PASSWORD);

            // When & Then
            mockMvc.perform(post(LOGIN_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.errorCode").value("AUTH_001"));
        }

        @Test
        @DisplayName("should return token with correct user roles")
        void login_WithValidCredentials_ReturnsTokenWithCorrectRoles() throws Exception {
            // Given - Finance user has FINANCE role
            LoginRequest request = new LoginRequest(FINANCE_USERNAME, TEST_PASSWORD);

            // When & Then
            mockMvc.perform(post(LOGIN_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.user.roles", hasItem("ROLE_FINANCE")))
                    .andExpect(jsonPath("$.data.user.roles", not(hasItem("ROLE_ADMIN"))));
        }
    }

    @Nested
    @DisplayName("POST /api/auth/logout")
    class LogoutTests {

        @Test
        @DisplayName("should return 200 on valid token")
        void logout_WithValidToken_Returns200() throws Exception {
            // Given - Generate valid token
            String token = jwtTokenProvider.generateToken(ADMIN_USERNAME, "ROLE_ADMIN");

            // When & Then
            mockMvc.perform(post(LOGOUT_URL)
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Logged out successfully"));
        }

        @Test
        @DisplayName("should return 401 on missing token")
        void logout_WithMissingToken_Returns401() throws Exception {
            // When & Then
            mockMvc.perform(post(LOGOUT_URL))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("should return 401 on invalid token")
        void logout_WithInvalidToken_Returns401() throws Exception {
            // When & Then
            mockMvc.perform(post(LOGOUT_URL)
                            .header("Authorization", "Bearer " + INVALID_JWT_TOKEN))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("should return 401 on expired token")
        void logout_WithExpiredToken_Returns401() throws Exception {
            // When & Then
            mockMvc.perform(post(LOGOUT_URL)
                            .header("Authorization", "Bearer " + EXPIRED_JWT_TOKEN))
                    .andExpect(status().isUnauthorized());
        }
    }
}
