package com.wellkorea.backend.auth.infrastructure.config;

import com.wellkorea.backend.BaseIntegrationTest;
import com.wellkorea.backend.auth.domain.vo.Role;
import com.wellkorea.backend.shared.test.TestFixtures;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration tests for Spring Security configuration.
 * Tests end-to-end authentication flow with real Spring Security filter chain.
 * <p>
 * Uses @AutoConfigureMockMvc to enable HTTP layer testing with MockMvc.
 */
@Tag("integration")
@AutoConfigureMockMvc
class SecurityIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private String validAdminToken;
    private String validFinanceToken;
    private String validSalesToken;

    @BeforeEach
    void setUp() {
        // Generate test tokens for different roles using TestFixtures and Role enum (userId required for approval workflows)
        validAdminToken = jwtTokenProvider.generateToken(TestFixtures.ADMIN_USERNAME, Role.ADMIN.getAuthority(), TestFixtures.TEST_USER_ID);
        validFinanceToken = jwtTokenProvider.generateToken(TestFixtures.FINANCE_USERNAME, Role.FINANCE.getAuthority(), 2L);
        validSalesToken = jwtTokenProvider.generateToken(TestFixtures.SALES_USERNAME, Role.SALES.getAuthority(), 4L);
    }

    // ========== Public Endpoint Tests ==========

    @Test
    void shouldAllowAccessToPublicHealthEndpoint() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk());
    }

    @Test
    void shouldAllowAccessToPublicSwaggerEndpoint() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk());
    }

    // ========== Authentication Required Tests ==========

    @Test
    void shouldRejectUnauthenticatedRequestToProtectedEndpoint() throws Exception {
        // Given: No Authorization header

        // When: Access protected endpoint
        mockMvc.perform(get("/api/projects"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldRejectRequestWithInvalidToken() throws Exception {
        // Given: Invalid JWT token
        String invalidToken = "invalid.jwt.token";

        // When: Access protected endpoint with invalid token
        mockMvc.perform(get("/api/projects")
                        .header("Authorization", "Bearer " + invalidToken))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldRejectRequestWithMalformedAuthorizationHeader() throws Exception {
        // Given: Malformed Authorization header (no "Bearer " prefix)

        // When: Access protected endpoint
        mockMvc.perform(get("/api/projects")
                        .header("Authorization", "InvalidFormat"))
                .andExpect(status().isUnauthorized());
    }

    // ========== Successful Authentication Tests ==========

    @Test
    void shouldAllowAuthenticatedRequestWithValidToken() throws Exception {
        // Given: Valid JWT token for ADMIN role

        // When: Access protected endpoint
        mockMvc.perform(get("/api/projects")
                        .header("Authorization", "Bearer " + validAdminToken))
                .andExpect(status().isOk());
    }

    @Test
    void shouldExtractUsernameFromTokenInSecurityContext() throws Exception {
        // Given: Valid token with username "admin"

        // When: Access endpoint that uses SecurityContext
        // Then: Username extracted correctly (verified by no authentication error)
        mockMvc.perform(get("/api/projects")
                        .header("Authorization", "Bearer " + validAdminToken))
                .andExpect(status().isOk());
    }

    // ========== CORS Tests ==========

    @Test
    void shouldAllowCorsPreflightRequest() throws Exception {
        mockMvc.perform(
                        org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options("/api/projects")
                                .header("Origin", "http://localhost:5173")
                                .header("Access-Control-Request-Method", "GET")
                                .header("Access-Control-Request-Headers", "Authorization")
                )
                .andExpect(status().isOk())
                .andExpect(header().exists("Access-Control-Allow-Origin"))
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"));
    }

    @Test
    void shouldIncludeCorsHeadersInResponse() throws Exception {
        mockMvc.perform(get("/api/projects")
                        .header("Origin", "http://localhost:5173")
                        .header("Authorization", "Bearer " + validAdminToken))
                .andExpect(status().isOk())
                .andExpect(header().exists("Access-Control-Allow-Origin"));
    }

    // ========== Token Expiration Tests ==========

    @Test
    void shouldRejectExpiredToken() throws Exception {
        // Given: Token with immediate expiration (1ms validity)
        JwtTokenProvider shortLivedProvider = new JwtTokenProvider(
                TestFixtures.JWT_SECRET,
                1L
        );
        String expiredToken = shortLivedProvider.generateToken(TestFixtures.TEST_USERNAME, Role.ADMIN.getAuthority(), 1L);

        // Wait for expiration
        Thread.sleep(10);

        // When: Access protected endpoint with expired token
        mockMvc.perform(get("/api/projects")
                        .header("Authorization", "Bearer " + expiredToken))
                .andExpect(status().isUnauthorized());
    }

    // ========== Role-Based Authorization Tests ==========

    @Test
    void shouldAllowAccessWithAdminRole() throws Exception {
        // Given: Valid token with ADMIN role

        // When: Access endpoint (any endpoint should be accessible to admin)
        mockMvc.perform(get("/api/projects")
                        .header("Authorization", "Bearer " + validAdminToken))
                .andExpect(status().isOk());
    }

    @Test
    void shouldAllowAccessWithFinanceRole() throws Exception {
        // Given: Valid token with FINANCE role

        // When: Access endpoint
        mockMvc.perform(get("/api/projects")
                        .header("Authorization", "Bearer " + validFinanceToken))
                .andExpect(status().isOk());
    }

    @Test
    void shouldAllowAccessWithSalesRole() throws Exception {
        // Given: Valid token with SALES role

        // When: Access endpoint
        mockMvc.perform(get("/api/projects")
                        .header("Authorization", "Bearer " + validSalesToken))
                .andExpect(status().isOk());
    }

}
