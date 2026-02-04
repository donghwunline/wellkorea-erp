package com.wellkorea.backend.shared.config;

import com.wellkorea.backend.BaseIntegrationTest;
import com.wellkorea.backend.core.auth.domain.vo.Role;
import com.wellkorea.backend.core.auth.infrastructure.config.JwtTokenProvider;
import com.wellkorea.backend.test.TestFixtures;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration tests for CorrelationIdFilter.
 * Tests end-to-end correlation ID behavior with real Spring Security filter chain.
 * <p>
 * Verifies that:
 * - X-Request-ID header is echoed back when provided
 * - X-Request-ID header is generated when not provided
 * - Header is present on both successful and error responses
 */
@Tag("integration")
@AutoConfigureMockMvc
class CorrelationIdFilterIntegrationTest extends BaseIntegrationTest {

    private static final String REQUEST_ID_HEADER = "X-Request-ID";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private String validAdminToken;

    @BeforeEach
    void setUp() {
        validAdminToken = jwtTokenProvider.generateToken(
                TestFixtures.ADMIN_USERNAME,
                Role.ADMIN.getAuthority(),
                TestFixtures.TEST_USER_ID
        );
    }

    // ========== Echo Back Provided Header Tests ==========

    @Test
    void shouldEchoBackProvidedCorrelationIdOnPublicEndpoint() throws Exception {
        // Given: Request with X-Request-ID header to public endpoint
        String providedCorrelationId = "test-request-id-public-123";

        // When/Then: Response contains same correlation ID
        mockMvc.perform(get("/actuator/health")
                        .header(REQUEST_ID_HEADER, providedCorrelationId))
                .andExpect(status().isOk())
                .andExpect(header().string(REQUEST_ID_HEADER, providedCorrelationId));
    }

    @Test
    void shouldEchoBackProvidedCorrelationIdOnAuthenticatedEndpoint() throws Exception {
        // Given: Authenticated request with X-Request-ID header
        String providedCorrelationId = "test-request-id-auth-456";

        // When/Then: Response contains same correlation ID
        mockMvc.perform(get("/api/projects")
                        .header("Authorization", "Bearer " + validAdminToken)
                        .header(REQUEST_ID_HEADER, providedCorrelationId))
                .andExpect(status().isOk())
                .andExpect(header().string(REQUEST_ID_HEADER, providedCorrelationId));
    }

    @Test
    void shouldEchoBackUuidFormatCorrelationId() throws Exception {
        // Given: Request with UUID-format correlation ID
        String uuidCorrelationId = UUID.randomUUID().toString();

        // When/Then: Response contains same UUID correlation ID
        mockMvc.perform(get("/actuator/health")
                        .header(REQUEST_ID_HEADER, uuidCorrelationId))
                .andExpect(status().isOk())
                .andExpect(header().string(REQUEST_ID_HEADER, uuidCorrelationId));
    }

    // ========== Generate When Not Provided Tests ==========

    @Test
    void shouldGenerateCorrelationIdWhenNotProvidedOnPublicEndpoint() throws Exception {
        // Given: Request without X-Request-ID header

        // When: Access public endpoint
        MvcResult result = mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(header().exists(REQUEST_ID_HEADER))
                .andReturn();

        // Then: Generated correlation ID is a valid UUID
        String generatedId = result.getResponse().getHeader(REQUEST_ID_HEADER);
        assertThat(generatedId).isNotBlank();
        assertThat(UUID.fromString(generatedId)).isNotNull();
    }

    @Test
    void shouldGenerateCorrelationIdWhenNotProvidedOnAuthenticatedEndpoint() throws Exception {
        // Given: Authenticated request without X-Request-ID header

        // When: Access protected endpoint
        MvcResult result = mockMvc.perform(get("/api/projects")
                        .header("Authorization", "Bearer " + validAdminToken))
                .andExpect(status().isOk())
                .andExpect(header().exists(REQUEST_ID_HEADER))
                .andReturn();

        // Then: Generated correlation ID is a valid UUID
        String generatedId = result.getResponse().getHeader(REQUEST_ID_HEADER);
        assertThat(generatedId).isNotBlank();
        assertThat(UUID.fromString(generatedId)).isNotNull();
    }

    @Test
    void shouldGenerateUniqueCorrelationIdsForDifferentRequests() throws Exception {
        // When: Make two requests without correlation ID
        MvcResult result1 = mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andReturn();

        MvcResult result2 = mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andReturn();

        // Then: Generated correlation IDs are different
        String correlationId1 = result1.getResponse().getHeader(REQUEST_ID_HEADER);
        String correlationId2 = result2.getResponse().getHeader(REQUEST_ID_HEADER);

        assertThat(correlationId1).isNotEqualTo(correlationId2);
    }

    // ========== Error Response Tests ==========

    @Test
    void shouldIncludeCorrelationIdOn401Response() throws Exception {
        // Given: Request to protected endpoint without authentication
        String providedCorrelationId = "test-401-error-id";

        // When/Then: 401 response still contains correlation ID
        mockMvc.perform(get("/api/projects")
                        .header(REQUEST_ID_HEADER, providedCorrelationId))
                .andExpect(status().isUnauthorized())
                .andExpect(header().string(REQUEST_ID_HEADER, providedCorrelationId));
    }

    @Test
    void shouldIncludeCorrelationIdOn401ResponseWithInvalidToken() throws Exception {
        // Given: Request with invalid token
        String providedCorrelationId = "test-invalid-token-id";

        // When/Then: 401 response still contains correlation ID
        mockMvc.perform(get("/api/projects")
                        .header("Authorization", "Bearer invalid.jwt.token")
                        .header(REQUEST_ID_HEADER, providedCorrelationId))
                .andExpect(status().isUnauthorized())
                .andExpect(header().string(REQUEST_ID_HEADER, providedCorrelationId));
    }

    @Test
    void shouldGenerateCorrelationIdOn401ResponseWhenNotProvided() throws Exception {
        // Given: Request to protected endpoint without authentication or correlation ID

        // When: Access protected endpoint
        MvcResult result = mockMvc.perform(get("/api/projects"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().exists(REQUEST_ID_HEADER))
                .andReturn();

        // Then: Generated correlation ID is a valid UUID
        String generatedId = result.getResponse().getHeader(REQUEST_ID_HEADER);
        assertThat(generatedId).isNotBlank();
        assertThat(UUID.fromString(generatedId)).isNotNull();
    }

    @Test
    void shouldIncludeCorrelationIdOn404Response() throws Exception {
        // Given: Request to non-existent endpoint
        String providedCorrelationId = "test-404-error-id";

        // When/Then: 404 response still contains correlation ID
        mockMvc.perform(get("/api/nonexistent/endpoint")
                        .header("Authorization", "Bearer " + validAdminToken)
                        .header(REQUEST_ID_HEADER, providedCorrelationId))
                .andExpect(status().isNotFound())
                .andExpect(header().string(REQUEST_ID_HEADER, providedCorrelationId));
    }

    // ========== CORS Preflight Tests ==========

    @Test
    void shouldIncludeCorrelationIdOnCorsPreflightResponse() throws Exception {
        // Given: CORS preflight request with correlation ID
        String providedCorrelationId = "test-cors-preflight-id";

        // When/Then: Preflight response contains correlation ID
        mockMvc.perform(
                        org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options("/api/projects")
                                .header("Origin", "http://localhost:5173")
                                .header("Access-Control-Request-Method", "GET")
                                .header("Access-Control-Request-Headers", "Authorization")
                                .header(REQUEST_ID_HEADER, providedCorrelationId))
                .andExpect(status().isOk())
                .andExpect(header().string(REQUEST_ID_HEADER, providedCorrelationId));
    }

    // ========== Header Value Edge Cases ==========

    @Test
    void shouldHandleLongCorrelationId() throws Exception {
        // Given: Request with long correlation ID
        String longCorrelationId = "very-long-correlation-id-" + "x".repeat(200);

        // When/Then: Response contains same long correlation ID
        mockMvc.perform(get("/actuator/health")
                        .header(REQUEST_ID_HEADER, longCorrelationId))
                .andExpect(status().isOk())
                .andExpect(header().string(REQUEST_ID_HEADER, longCorrelationId));
    }

    @Test
    void shouldHandleSpecialCharactersInCorrelationId() throws Exception {
        // Given: Request with special characters in correlation ID
        String specialCorrelationId = "req-123_test.id-abc";

        // When/Then: Response contains same correlation ID
        mockMvc.perform(get("/actuator/health")
                        .header(REQUEST_ID_HEADER, specialCorrelationId))
                .andExpect(status().isOk())
                .andExpect(header().string(REQUEST_ID_HEADER, specialCorrelationId));
    }
}
