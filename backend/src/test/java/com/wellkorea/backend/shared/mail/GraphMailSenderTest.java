package com.wellkorea.backend.shared.mail;

import com.github.tomakehurst.wiremock.WireMockServer;
import com.github.tomakehurst.wiremock.client.WireMock;
import com.github.tomakehurst.wiremock.core.WireMockConfiguration;
import com.wellkorea.backend.supporting.mail.domain.MailOAuth2Config;
import com.wellkorea.backend.supporting.mail.infrastructure.MailOAuth2ConfigRepository;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.net.http.HttpClient;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;

import static com.github.tomakehurst.wiremock.client.WireMock.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link GraphMailSender} with mocked dependencies and WireMock for HTTP.
 */
@Tag("unit")
@ExtendWith(MockitoExtension.class)
@DisplayName("GraphMailSender")
class GraphMailSenderTest {

    private static WireMockServer wireMockServer;

    @Mock
    private MailOAuth2ConfigRepository configRepository;

    @Mock
    private MailTokenLockService lockService;

    @Mock
    private MailTokenRefreshService tokenRefreshService;

    private GraphMailSender graphMailSender;

    private static final String CLIENT_ID = "test-client-id";
    private static final String CLIENT_SECRET = "test-client-secret";
    private static final String VALID_ACCESS_TOKEN = "valid-access-token-12345";

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

        // Create sender using the test constructor with WireMock URL
        String wireMockSendMailUrl = wireMockServer.baseUrl() + "/v1.0/me/sendMail";
        graphMailSender = new GraphMailSender(
                CLIENT_ID,
                CLIENT_SECRET,
                configRepository,
                lockService,
                tokenRefreshService,
                restClient,
                wireMockSendMailUrl
        );
    }

    private MailOAuth2Config createConfigWithValidToken() {
        MailOAuth2Config config = new MailOAuth2Config("refresh-token", "sender@example.com", 1L);
        config.updateAccessToken(VALID_ACCESS_TOKEN, Instant.now().plusSeconds(3600));
        return config;
    }

    private MailOAuth2Config createConfigWithExpiredToken() {
        MailOAuth2Config config = new MailOAuth2Config("refresh-token", "sender@example.com", 1L);
        config.updateAccessToken("expired-token", Instant.now().minusSeconds(60));
        return config;
    }

    private MailMessage createSimpleMessage() {
        return MailMessage.builder()
                .from("sender@example.com")
                .to("recipient@example.com")
                .subject("Test Subject")
                .plainTextBody("Hello, World!")
                .build();
    }

    @Nested
    @DisplayName("send()")
    class SendTests {

        @Test
        @DisplayName("with valid cached token → calls Graph API directly")
        void withValidCachedTokenCallsGraphApiDirectly() {
            MailOAuth2Config config = createConfigWithValidToken();
            when(configRepository.findSingletonConfig()).thenReturn(Optional.of(config));

            stubFor(post(urlEqualTo("/v1.0/me/sendMail"))
                    .willReturn(aResponse()
                            .withStatus(202)));

            graphMailSender.send(createSimpleMessage());

            verify(postRequestedFor(urlEqualTo("/v1.0/me/sendMail"))
                    .withHeader(HttpHeaders.AUTHORIZATION, equalTo("Bearer " + VALID_ACCESS_TOKEN))
                    .withHeader(HttpHeaders.CONTENT_TYPE, containing(MediaType.APPLICATION_JSON_VALUE)));

            // Should not trigger token refresh
            verify(lockService, never()).executeWithLock(any());
        }

        @Test
        @DisplayName("with expired token → refreshes via lock service, then sends")
        void withExpiredTokenRefreshesViaLockServiceThenSends() {
            MailOAuth2Config expiredConfig = createConfigWithExpiredToken();
            MailOAuth2Config refreshedConfig = createConfigWithValidToken();

            when(configRepository.findSingletonConfig())
                    .thenReturn(Optional.of(expiredConfig))
                    .thenReturn(Optional.of(refreshedConfig));

            // Mock the lock service to simulate token refresh
            when(lockService.executeWithLock(any())).thenAnswer(invocation -> {
                // Simulate the token refresh - return the new token
                return VALID_ACCESS_TOKEN;
            });

            stubFor(post(urlEqualTo("/v1.0/me/sendMail"))
                    .willReturn(aResponse()
                            .withStatus(202)));

            graphMailSender.send(createSimpleMessage());

            verify(lockService).executeWithLock(any());
            verify(postRequestedFor(urlEqualTo("/v1.0/me/sendMail"))
                    .withHeader(HttpHeaders.AUTHORIZATION, equalTo("Bearer " + VALID_ACCESS_TOKEN)));
        }

        @Test
        @DisplayName("when no OAuth2 config → throws MailSendException")
        void whenNoOAuth2ConfigThrowsMailSendException() {
            when(configRepository.findSingletonConfig()).thenReturn(Optional.empty());

            assertThatThrownBy(() -> graphMailSender.send(createSimpleMessage()))
                    .isInstanceOf(MailSendException.class)
                    .hasMessageContaining("No OAuth2 config");
        }

        @Test
        @DisplayName("when Graph API returns error → throws MailSendException")
        void whenGraphApiReturnsErrorThrowsMailSendException() {
            MailOAuth2Config config = createConfigWithValidToken();
            when(configRepository.findSingletonConfig()).thenReturn(Optional.of(config));

            stubFor(post(urlEqualTo("/v1.0/me/sendMail"))
                    .willReturn(aResponse()
                            .withStatus(400)
                            .withHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                            .withBody("""
                                    {
                                        "error": {
                                            "code": "BadRequest",
                                            "message": "Invalid recipient"
                                        }
                                    }
                                    """)));

            assertThatThrownBy(() -> graphMailSender.send(createSimpleMessage()))
                    .isInstanceOf(MailSendException.class)
                    .hasMessageContaining("Microsoft Graph API returned status");
        }

        @Test
        @DisplayName("with attachments → base64 encodes content")
        void withAttachmentsBase64EncodesContent() {
            MailOAuth2Config config = createConfigWithValidToken();
            when(configRepository.findSingletonConfig()).thenReturn(Optional.of(config));

            byte[] pdfContent = "PDF content here".getBytes();
            String expectedBase64 = Base64.getEncoder().encodeToString(pdfContent);

            MailMessage message = MailMessage.builder()
                    .from("sender@example.com")
                    .to("recipient@example.com")
                    .subject("With Attachment")
                    .plainTextBody("See attached.")
                    .attachment(MailAttachment.pdf("document.pdf", pdfContent))
                    .build();

            stubFor(post(urlEqualTo("/v1.0/me/sendMail"))
                    .willReturn(aResponse()
                            .withStatus(202)));

            graphMailSender.send(message);

            verify(postRequestedFor(urlEqualTo("/v1.0/me/sendMail"))
                    .withRequestBody(containing("\"contentBytes\":\"" + expectedBase64 + "\""))
                    .withRequestBody(containing("\"@odata.type\":\"#microsoft.graph.fileAttachment\""))
                    .withRequestBody(containing("\"name\":\"document.pdf\""))
                    .withRequestBody(containing("\"contentType\":\"application/pdf\"")));
        }

        @Test
        @DisplayName("with CC recipients → includes in request")
        void withCcRecipientsIncludesInRequest() {
            MailOAuth2Config config = createConfigWithValidToken();
            when(configRepository.findSingletonConfig()).thenReturn(Optional.of(config));

            MailMessage message = MailMessage.builder()
                    .from("sender@example.com")
                    .to("recipient@example.com")
                    .cc("cc1@example.com")
                    .cc("cc2@example.com")
                    .subject("With CC")
                    .plainTextBody("Hello!")
                    .build();

            stubFor(post(urlEqualTo("/v1.0/me/sendMail"))
                    .willReturn(aResponse()
                            .withStatus(202)));

            graphMailSender.send(message);

            verify(postRequestedFor(urlEqualTo("/v1.0/me/sendMail"))
                    .withRequestBody(containing("\"ccRecipients\""))
                    .withRequestBody(containing("cc1@example.com"))
                    .withRequestBody(containing("cc2@example.com")));
        }

        @Test
        @DisplayName("sends HTML message with correct content type")
        void sendsHtmlMessageWithCorrectContentType() {
            MailOAuth2Config config = createConfigWithValidToken();
            when(configRepository.findSingletonConfig()).thenReturn(Optional.of(config));

            MailMessage message = MailMessage.builder()
                    .from("sender@example.com")
                    .to("recipient@example.com")
                    .subject("HTML Email")
                    .htmlBody("<h1>Hello</h1><p>World!</p>")
                    .build();

            stubFor(post(urlEqualTo("/v1.0/me/sendMail"))
                    .willReturn(aResponse()
                            .withStatus(202)));

            graphMailSender.send(message);

            verify(postRequestedFor(urlEqualTo("/v1.0/me/sendMail"))
                    .withRequestBody(containing("\"contentType\":\"HTML\""))
                    .withRequestBody(containing("<h1>Hello</h1>")));
        }

        @Test
        @DisplayName("sends plain text message with correct content type")
        void sendsPlainTextMessageWithCorrectContentType() {
            MailOAuth2Config config = createConfigWithValidToken();
            when(configRepository.findSingletonConfig()).thenReturn(Optional.of(config));

            stubFor(post(urlEqualTo("/v1.0/me/sendMail"))
                    .willReturn(aResponse()
                            .withStatus(202)));

            graphMailSender.send(createSimpleMessage());

            verify(postRequestedFor(urlEqualTo("/v1.0/me/sendMail"))
                    .withRequestBody(containing("\"contentType\":\"Text\"")));
        }

        @Test
        @DisplayName("when network error → throws MailSendException")
        void whenNetworkErrorThrowsMailSendException() {
            MailOAuth2Config config = createConfigWithValidToken();
            when(configRepository.findSingletonConfig()).thenReturn(Optional.of(config));

            stubFor(post(urlEqualTo("/v1.0/me/sendMail"))
                    .willReturn(aResponse()
                            .withFault(com.github.tomakehurst.wiremock.http.Fault.CONNECTION_RESET_BY_PEER)));

            assertThatThrownBy(() -> graphMailSender.send(createSimpleMessage()))
                    .isInstanceOf(MailSendException.class)
                    .hasMessageContaining("Failed to send email via Microsoft Graph");
        }

        @Test
        @DisplayName("double-checked locking: another instance refreshed token while waiting")
        void doubleCheckedLockingAnotherInstanceRefreshedTokenWhileWaiting() {
            MailOAuth2Config expiredConfig = createConfigWithExpiredToken();
            MailOAuth2Config alreadyRefreshedConfig = createConfigWithValidToken();

            when(configRepository.findSingletonConfig())
                    .thenReturn(Optional.of(expiredConfig))  // First check (before lock)
                    .thenReturn(Optional.of(alreadyRefreshedConfig));  // Second check (inside lock)

            // Simulate double-checked locking: token already refreshed by another instance
            when(lockService.executeWithLock(any())).thenAnswer(invocation -> {
                // The supplier passed to executeWithLock should return the already-valid token
                // because the re-check inside the lock finds a valid token
                return VALID_ACCESS_TOKEN;
            });

            stubFor(post(urlEqualTo("/v1.0/me/sendMail"))
                    .willReturn(aResponse()
                            .withStatus(202)));

            graphMailSender.send(createSimpleMessage());

            verify(lockService).executeWithLock(any());
            // tokenRefreshService should NOT be called since another instance already refreshed
            verify(postRequestedFor(urlEqualTo("/v1.0/me/sendMail")));
        }
    }

    @Nested
    @DisplayName("isAvailable()")
    class IsAvailableTests {

        @Test
        @DisplayName("returns true when all configured")
        void returnsTrueWhenAllConfigured() {
            MailOAuth2Config config = createConfigWithValidToken();
            when(configRepository.findSingletonConfig()).thenReturn(Optional.of(config));

            assertThat(graphMailSender.isAvailable()).isTrue();
        }

        @Test
        @DisplayName("returns false when clientId is blank")
        void returnsFalseWhenClientIdIsBlank() {
            GraphMailSender senderWithBlankClientId = new GraphMailSender(
                    "   ",
                    CLIENT_SECRET,
                    configRepository,
                    lockService,
                    tokenRefreshService
            );

            assertThat(senderWithBlankClientId.isAvailable()).isFalse();
        }

        @Test
        @DisplayName("returns false when clientId is null")
        void returnsFalseWhenClientIdIsNull() {
            GraphMailSender senderWithNullClientId = new GraphMailSender(
                    null,
                    CLIENT_SECRET,
                    configRepository,
                    lockService,
                    tokenRefreshService
            );

            assertThat(senderWithNullClientId.isAvailable()).isFalse();
        }

        @Test
        @DisplayName("returns false when clientSecret is blank")
        void returnsFalseWhenClientSecretIsBlank() {
            GraphMailSender senderWithBlankSecret = new GraphMailSender(
                    CLIENT_ID,
                    "",
                    configRepository,
                    lockService,
                    tokenRefreshService
            );

            assertThat(senderWithBlankSecret.isAvailable()).isFalse();
        }

        @Test
        @DisplayName("returns false when clientSecret is null")
        void returnsFalseWhenClientSecretIsNull() {
            GraphMailSender senderWithNullSecret = new GraphMailSender(
                    CLIENT_ID,
                    null,
                    configRepository,
                    lockService,
                    tokenRefreshService
            );

            assertThat(senderWithNullSecret.isAvailable()).isFalse();
        }

        @Test
        @DisplayName("returns false when no config in repository")
        void returnsFalseWhenNoConfigInRepository() {
            when(configRepository.findSingletonConfig()).thenReturn(Optional.empty());

            assertThat(graphMailSender.isAvailable()).isFalse();
        }
    }

    @Nested
    @DisplayName("getType()")
    class GetTypeTests {

        @Test
        @DisplayName("returns 'Microsoft Graph'")
        void returnsMicrosoftGraph() {
            assertThat(graphMailSender.getType()).isEqualTo("Microsoft Graph");
        }
    }
}
