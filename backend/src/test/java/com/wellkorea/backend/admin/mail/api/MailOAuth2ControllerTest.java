package com.wellkorea.backend.admin.mail.api;

import com.wellkorea.backend.BaseIntegrationTest;
import com.wellkorea.backend.admin.mail.application.MailOAuth2Service;
import com.wellkorea.backend.auth.domain.vo.Role;
import com.wellkorea.backend.auth.infrastructure.config.JwtTokenProvider;
import com.wellkorea.backend.shared.exception.ErrorCode;
import com.wellkorea.backend.shared.exception.OAuth2Exception;
import com.wellkorea.backend.shared.test.DatabaseTestHelper;
import com.wellkorea.backend.shared.test.TestFixtures;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for MailOAuth2Controller.
 * Tests authentication, authorization, and error code handling.
 */
@Tag("integration")
@AutoConfigureMockMvc
@Transactional
@DisplayName("MailOAuth2Controller Integration Tests")
class MailOAuth2ControllerTest extends BaseIntegrationTest implements TestFixtures {

    private static final String STATUS_URL = "/api/admin/mail/oauth2/status";
    private static final String AUTHORIZE_URL = "/api/admin/mail/oauth2/authorize";
    private static final String CALLBACK_URL = "/api/admin/mail/oauth2/callback";
    private static final String DISCONNECT_URL = "/api/admin/mail/oauth2";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private MailOAuth2Service oAuth2Service;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    private String adminToken;
    private String salesToken;

    @BeforeEach
    void setUp() {
        DatabaseTestHelper.insertTestUsersWithRoles(jdbcTemplate);

        // Generate tokens for different roles
        adminToken = jwtTokenProvider.generateToken(ADMIN_USERNAME, Role.ADMIN.getAuthority(), TEST_USER_ID);
        salesToken = jwtTokenProvider.generateToken(SALES_USERNAME, Role.SALES.getAuthority(), 4L);
    }

    @Nested
    @DisplayName("GET /api/admin/mail/oauth2/status")
    class GetStatusTests {

        @Test
        @DisplayName("should return 200 for Admin user")
        void getStatus_AsAdmin_Returns200() throws Exception {
            // Given
            var status = new MailOAuth2Service.MailConfigStatus(true, "sender@example.com", Instant.now(), 1L);
            when(oAuth2Service.getStatus()).thenReturn(status);
            when(oAuth2Service.isMicrosoftConfigured()).thenReturn(true);

            // When & Then
            mockMvc.perform(get(STATUS_URL)
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.connected").value(true))
                    .andExpect(jsonPath("$.data.senderEmail").value("sender@example.com"))
                    .andExpect(jsonPath("$.data.microsoftConfigured").value(true));
        }

        @Test
        @DisplayName("should return 401 for unauthenticated request")
        void getStatus_Unauthenticated_Returns401() throws Exception {
            mockMvc.perform(get(STATUS_URL))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("should return 403 for non-admin user (Sales)")
        void getStatus_AsSales_Returns403() throws Exception {
            mockMvc.perform(get(STATUS_URL)
                            .header("Authorization", "Bearer " + salesToken))
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("GET /api/admin/mail/oauth2/callback")
    class CallbackTests {

        @Test
        @DisplayName("should redirect with error code OAUTH_001 on invalid state")
        void callback_InvalidState_RedirectsWithErrorCode() throws Exception {
            // Given
            doThrow(new OAuth2Exception(ErrorCode.OAUTH_INVALID_STATE))
                    .when(oAuth2Service).handleCallback(anyString(), anyString());

            // When & Then
            mockMvc.perform(get(CALLBACK_URL)
                            .param("code", "test-code")
                            .param("state", "invalid-state"))
                    .andExpect(status().is3xxRedirection())
                    .andExpect(redirectedUrl(frontendUrl + "/admin/settings/mail?error=OAUTH_001"));
        }

        @Test
        @DisplayName("should redirect with error code OAUTH_002 on expired state")
        void callback_ExpiredState_RedirectsWithErrorCode() throws Exception {
            // Given
            doThrow(new OAuth2Exception(ErrorCode.OAUTH_STATE_EXPIRED))
                    .when(oAuth2Service).handleCallback(anyString(), anyString());

            // When & Then
            mockMvc.perform(get(CALLBACK_URL)
                            .param("code", "test-code")
                            .param("state", "expired-state"))
                    .andExpect(status().is3xxRedirection())
                    .andExpect(redirectedUrl(frontendUrl + "/admin/settings/mail?error=OAUTH_002"));
        }

        @Test
        @DisplayName("should redirect with SRV_001 on unexpected exception")
        void callback_UnexpectedException_RedirectsWithServerErrorCode() throws Exception {
            // Given
            doThrow(new RuntimeException("Unexpected error"))
                    .when(oAuth2Service).handleCallback(anyString(), anyString());

            // When & Then
            mockMvc.perform(get(CALLBACK_URL)
                            .param("code", "test-code")
                            .param("state", "test-state"))
                    .andExpect(status().is3xxRedirection())
                    .andExpect(redirectedUrl(frontendUrl + "/admin/settings/mail?error=SRV_001"));
        }

        @Test
        @DisplayName("should redirect with success=true on successful callback")
        void callback_Success_RedirectsWithSuccess() throws Exception {
            // Given - no exception thrown

            // When & Then
            mockMvc.perform(get(CALLBACK_URL)
                            .param("code", "test-code")
                            .param("state", "test-state"))
                    .andExpect(status().is3xxRedirection())
                    .andExpect(redirectedUrl(frontendUrl + "/admin/settings/mail?success=true"));
        }
    }

    @Nested
    @DisplayName("DELETE /api/admin/mail/oauth2")
    class DisconnectTests {

        @Test
        @DisplayName("should return 200 for Admin user")
        void disconnect_AsAdmin_Returns200() throws Exception {
            mockMvc.perform(delete(DISCONNECT_URL)
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }

        @Test
        @DisplayName("should return 403 for non-admin user")
        void disconnect_AsNonAdmin_Returns403() throws Exception {
            mockMvc.perform(delete(DISCONNECT_URL)
                            .header("Authorization", "Bearer " + salesToken))
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("GET /api/admin/mail/oauth2/authorize")
    class AuthorizeTests {

        @Test
        @DisplayName("should return authorization URL for Admin user")
        void authorize_AsAdmin_ReturnsUrl() throws Exception {
            // Given
            when(oAuth2Service.generateAuthorizationUrl(anyLong()))
                    .thenReturn("https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize?...");

            // When & Then
            mockMvc.perform(get(AUTHORIZE_URL)
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.authorizationUrl").isNotEmpty());
        }
    }
}
