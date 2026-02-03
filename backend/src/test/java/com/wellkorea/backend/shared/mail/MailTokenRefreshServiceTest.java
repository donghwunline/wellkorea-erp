package com.wellkorea.backend.shared.mail;

import com.github.tomakehurst.wiremock.WireMockServer;
import com.github.tomakehurst.wiremock.client.WireMock;
import com.github.tomakehurst.wiremock.core.WireMockConfiguration;
import com.wellkorea.backend.supporting.mail.domain.MailOAuth2Config;
import com.wellkorea.backend.supporting.mail.infrastructure.MailOAuth2ConfigRepository;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.net.http.HttpClient;
import java.time.Instant;

import static com.github.tomakehurst.wiremock.client.WireMock.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link MailTokenRefreshService} with WireMock for HTTP mocking.
 */
@Tag("unit")
@ExtendWith(MockitoExtension.class)
@DisplayName("MailTokenRefreshService")
class MailTokenRefreshServiceTest {

    private static WireMockServer wireMockServer;

    @Mock
    private MailOAuth2ConfigRepository configRepository;

    private MailTokenRefreshService tokenRefreshService;
    private MailOAuth2Config config;

    private static final String CLIENT_ID = "test-client-id";
    private static final String CLIENT_SECRET = "test-client-secret";

    @BeforeAll
    static void startWireMock() {
        wireMockServer = new WireMockServer(WireMockConfiguration.wireMockConfig()
                .dynamicPort());
        wireMockServer.start();
        WireMock.configureFor("localhost", wireMockServer.port());
    }

    @AfterAll
    static void stopWireMock() {
        wireMockServer.stop();
    }

    @BeforeEach
    void setUp() {
        wireMockServer.resetAll();

        // Create RestClient with HTTP/1.1 to avoid HTTP/2 issues with WireMock
        HttpClient httpClient = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_1_1)
                .build();
        RestClient restClient = RestClient.builder()
                .requestFactory(new JdkClientHttpRequestFactory(httpClient))
                .build();

        // Create service using the test constructor with WireMock URL
        String wireMockTokenUrl = wireMockServer.baseUrl() + "/consumers/oauth2/v2.0/token";
        tokenRefreshService = new MailTokenRefreshService(
                configRepository,
                restClient,
                wireMockTokenUrl
        );

        // Create a test config
        config = new MailOAuth2Config("old-refresh-token", "sender@example.com", 1L);
    }

    @Nested
    @DisplayName("refreshToken()")
    class RefreshTokenTests {

        @Test
        @DisplayName("success → updates config with new access token")
        void successUpdatesConfigWithNewAccessToken() {
            stubFor(post(urlEqualTo("/consumers/oauth2/v2.0/token"))
                    .willReturn(aResponse()
                            .withStatus(200)
                            .withHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                            .withBody("""
                                    {
                                        "access_token": "new-access-token-12345",
                                        "expires_in": 3600,
                                        "token_type": "Bearer",
                                        "scope": "Mail.Send offline_access"
                                    }
                                    """)));

            String result = tokenRefreshService.refreshToken(config, CLIENT_ID, CLIENT_SECRET);

            assertThat(result).isEqualTo("new-access-token-12345");
            assertThat(config.getAccessToken()).isEqualTo("new-access-token-12345");
            assertThat(config.getTokenExpiresAt()).isAfter(Instant.now());
            assertThat(config.getLastRefreshAt()).isNotNull();

            ArgumentCaptor<MailOAuth2Config> captor = ArgumentCaptor.forClass(MailOAuth2Config.class);
            verify(configRepository).save(captor.capture());
            assertThat(captor.getValue().getAccessToken()).isEqualTo("new-access-token-12345");
        }

        @Test
        @DisplayName("success with new refresh token → rotates refresh token")
        void successWithNewRefreshTokenRotatesRefreshToken() {
            stubFor(post(urlEqualTo("/consumers/oauth2/v2.0/token"))
                    .willReturn(aResponse()
                            .withStatus(200)
                            .withHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                            .withBody("""
                                    {
                                        "access_token": "new-access-token",
                                        "expires_in": 3600,
                                        "refresh_token": "new-refresh-token-rotated",
                                        "token_type": "Bearer"
                                    }
                                    """)));

            String result = tokenRefreshService.refreshToken(config, CLIENT_ID, CLIENT_SECRET);

            assertThat(result).isEqualTo("new-access-token");
            assertThat(config.getRefreshToken()).isEqualTo("new-refresh-token-rotated");
            assertThat(config.getRefreshTokenRotatedAt()).isNotNull();

            verify(configRepository).save(config);
        }

        @Test
        @DisplayName("sends correct form data in request")
        void sendsCorrectFormDataInRequest() {
            stubFor(post(urlEqualTo("/consumers/oauth2/v2.0/token"))
                    .willReturn(aResponse()
                            .withStatus(200)
                            .withHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                            .withBody("""
                                    {
                                        "access_token": "token",
                                        "expires_in": 3600
                                    }
                                    """)));

            tokenRefreshService.refreshToken(config, CLIENT_ID, CLIENT_SECRET);

            verify(postRequestedFor(urlEqualTo("/consumers/oauth2/v2.0/token"))
                    .withHeader(HttpHeaders.CONTENT_TYPE, containing(MediaType.APPLICATION_FORM_URLENCODED_VALUE))
                    .withRequestBody(containing("client_id=" + CLIENT_ID))
                    .withRequestBody(containing("client_secret=" + CLIENT_SECRET))
                    .withRequestBody(containing("refresh_token=old-refresh-token"))
                    .withRequestBody(containing("grant_type=refresh_token"))
                    .withRequestBody(containing("scope=")));
        }

        @Test
        @DisplayName("throws MailSendException when Microsoft returns error")
        void throwsMailSendExceptionWhenMicrosoftReturnsError() {
            stubFor(post(urlEqualTo("/consumers/oauth2/v2.0/token"))
                    .willReturn(aResponse()
                            .withStatus(400)
                            .withHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                            .withBody("""
                                    {
                                        "error": "invalid_grant",
                                        "error_description": "Refresh token has expired"
                                    }
                                    """)));

            assertThatThrownBy(() -> tokenRefreshService.refreshToken(config, CLIENT_ID, CLIENT_SECRET))
                    .isInstanceOf(MailSendException.class)
                    .hasMessageContaining("Token refresh failed");

            verify(configRepository, never()).save(any());
        }

        @Test
        @DisplayName("throws MailSendException when response missing access token")
        void throwsMailSendExceptionWhenResponseMissingAccessToken() {
            stubFor(post(urlEqualTo("/consumers/oauth2/v2.0/token"))
                    .willReturn(aResponse()
                            .withStatus(200)
                            .withHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                            .withBody("""
                                    {
                                        "expires_in": 3600,
                                        "token_type": "Bearer"
                                    }
                                    """)));

            assertThatThrownBy(() -> tokenRefreshService.refreshToken(config, CLIENT_ID, CLIENT_SECRET))
                    .isInstanceOf(MailSendException.class)
                    .hasMessageContaining("No access token in refresh response");

            verify(configRepository, never()).save(any());
        }

        @Test
        @DisplayName("throws MailSendException when response is null/empty")
        void throwsMailSendExceptionWhenResponseIsNullOrEmpty() {
            stubFor(post(urlEqualTo("/consumers/oauth2/v2.0/token"))
                    .willReturn(aResponse()
                            .withStatus(200)
                            .withHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                            .withBody("null")));

            assertThatThrownBy(() -> tokenRefreshService.refreshToken(config, CLIENT_ID, CLIENT_SECRET))
                    .isInstanceOf(MailSendException.class);

            verify(configRepository, never()).save(any());
        }

        @Test
        @DisplayName("throws MailSendException when network error")
        void throwsMailSendExceptionWhenNetworkError() {
            stubFor(post(urlEqualTo("/consumers/oauth2/v2.0/token"))
                    .willReturn(aResponse()
                            .withFault(com.github.tomakehurst.wiremock.http.Fault.CONNECTION_RESET_BY_PEER)));

            assertThatThrownBy(() -> tokenRefreshService.refreshToken(config, CLIENT_ID, CLIENT_SECRET))
                    .isInstanceOf(MailSendException.class)
                    .hasMessageContaining("Failed to refresh access token");

            verify(configRepository, never()).save(any());
        }

        @Test
        @DisplayName("ignores blank refresh token in response")
        void ignoresBlankRefreshTokenInResponse() {
            String originalRefreshToken = config.getRefreshToken();

            stubFor(post(urlEqualTo("/consumers/oauth2/v2.0/token"))
                    .willReturn(aResponse()
                            .withStatus(200)
                            .withHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                            .withBody("""
                                    {
                                        "access_token": "new-access-token",
                                        "expires_in": 3600,
                                        "refresh_token": "   ",
                                        "token_type": "Bearer"
                                    }
                                    """)));

            tokenRefreshService.refreshToken(config, CLIENT_ID, CLIENT_SECRET);

            // Refresh token should not be rotated when blank
            assertThat(config.getRefreshToken()).isEqualTo(originalRefreshToken);
            assertThat(config.getRefreshTokenRotatedAt()).isNull();
        }

        @Test
        @DisplayName("handles 401 Unauthorized error")
        void handles401UnauthorizedError() {
            stubFor(post(urlEqualTo("/consumers/oauth2/v2.0/token"))
                    .willReturn(aResponse()
                            .withStatus(401)
                            .withHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                            .withBody("""
                                    {
                                        "error": "unauthorized_client",
                                        "error_description": "Client authentication failed"
                                    }
                                    """)));

            assertThatThrownBy(() -> tokenRefreshService.refreshToken(config, CLIENT_ID, CLIENT_SECRET))
                    .isInstanceOf(MailSendException.class)
                    .hasMessageContaining("Token refresh failed");
        }

        @Test
        @DisplayName("handles 500 Server Error")
        void handles500ServerError() {
            stubFor(post(urlEqualTo("/consumers/oauth2/v2.0/token"))
                    .willReturn(aResponse()
                            .withStatus(500)
                            .withBody("Internal Server Error")));

            assertThatThrownBy(() -> tokenRefreshService.refreshToken(config, CLIENT_ID, CLIENT_SECRET))
                    .isInstanceOf(MailSendException.class)
                    .hasMessageContaining("Token refresh failed");
        }
    }
}
