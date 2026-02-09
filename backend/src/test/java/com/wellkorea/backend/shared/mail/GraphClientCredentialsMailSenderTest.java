package com.wellkorea.backend.shared.mail;

import com.github.tomakehurst.wiremock.WireMockServer;
import com.github.tomakehurst.wiremock.client.WireMock;
import com.github.tomakehurst.wiremock.core.WireMockConfiguration;
import org.junit.jupiter.api.*;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestClient;

import java.net.http.HttpClient;
import java.util.Base64;

import static com.github.tomakehurst.wiremock.client.WireMock.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Unit tests for {@link GraphClientCredentialsMailSender} with WireMock for HTTP mocking.
 */
@Tag("unit")
@DisplayName("GraphClientCredentialsMailSender")
class GraphClientCredentialsMailSenderTest {

    private static WireMockServer wireMockServer;

    private GraphClientCredentialsMailSender mailSender;

    private static final String TENANT_ID = "test-tenant-id";
    private static final String CLIENT_ID = "test-client-id";
    private static final String CLIENT_SECRET = "test-client-secret";
    private static final String SENDER_EMAIL = "sender@company.com";
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

        // Create sender using the test constructor with WireMock URLs
        String wireMockGraphApiBase = wireMockServer.baseUrl() + "/v1.0";
        String wireMockTokenUrlTemplate = wireMockServer.baseUrl() + "/%s/oauth2/v2.0/token";

        mailSender = new GraphClientCredentialsMailSender(
                TENANT_ID,
                CLIENT_ID,
                CLIENT_SECRET,
                SENDER_EMAIL,
                restClient,
                wireMockGraphApiBase,
                wireMockTokenUrlTemplate
        );
    }

    private MailMessage createSimpleMessage() {
        return MailMessage.builder()
                .from("sender@company.com")
                .to("recipient@example.com")
                .subject("Test Subject")
                .plainTextBody("Hello, World!")
                .build();
    }

    private void stubTokenEndpoint() {
        stubFor(post(urlPathMatching("/" + TENANT_ID + "/oauth2/v2.0/token"))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                        .withBody("""
                                {
                                    "access_token": "%s",
                                    "expires_in": 3600,
                                    "token_type": "Bearer"
                                }
                                """.formatted(VALID_ACCESS_TOKEN))));
    }

    private void stubSendMailEndpoint() {
        // Use regex pattern to match any URL-encoded email
        stubFor(post(urlPathMatching("/v1.0/users/.*/sendMail"))
                .willReturn(aResponse()
                        .withStatus(202)));
    }

    @Nested
    @DisplayName("send()")
    class SendTests {

        @Test
        @DisplayName("with valid cached token → calls Graph API directly")
        void withValidCachedTokenCallsGraphApiDirectly() {
            // Pre-set a valid cached token
            ReflectionTestUtils.setField(mailSender, "accessToken", VALID_ACCESS_TOKEN);
            ReflectionTestUtils.setField(mailSender, "tokenExpiryTime", System.currentTimeMillis() + 3600_000);

            stubSendMailEndpoint();

            mailSender.send(createSimpleMessage());

            verify(postRequestedFor(urlPathMatching("/v1.0/users/.*/sendMail"))
                    .withHeader(HttpHeaders.AUTHORIZATION, equalTo("Bearer " + VALID_ACCESS_TOKEN)));

            // Should not request a new token
            verify(0, postRequestedFor(urlPathMatching(".*oauth2/v2.0/token")));
        }

        @Test
        @DisplayName("with expired token → acquires new token, then sends")
        void withExpiredTokenAcquiresNewTokenThenSends() {
            // Set expired token
            ReflectionTestUtils.setField(mailSender, "accessToken", "old-token");
            ReflectionTestUtils.setField(mailSender, "tokenExpiryTime", System.currentTimeMillis() - 1000);

            stubTokenEndpoint();
            stubSendMailEndpoint();

            mailSender.send(createSimpleMessage());

            // Should request a new token
            verify(postRequestedFor(urlPathMatching(".*oauth2/v2.0/token")));

            // Should use the new token for sending
            verify(postRequestedFor(urlPathMatching("/v1.0/users/.*/sendMail"))
                    .withHeader(HttpHeaders.AUTHORIZATION, equalTo("Bearer " + VALID_ACCESS_TOKEN)));
        }

        @Test
        @DisplayName("with no cached token → acquires token first")
        void withNoCachedTokenAcquiresTokenFirst() {
            stubTokenEndpoint();
            stubSendMailEndpoint();

            mailSender.send(createSimpleMessage());

            verify(postRequestedFor(urlPathMatching(".*oauth2/v2.0/token")));
            verify(postRequestedFor(urlPathMatching("/v1.0/users/.*/sendMail")));
        }

        @Test
        @DisplayName("builds correct request for user/{email}/sendMail endpoint")
        void buildsCorrectRequestForUserEmailSendMailEndpoint() {
            ReflectionTestUtils.setField(mailSender, "accessToken", VALID_ACCESS_TOKEN);
            ReflectionTestUtils.setField(mailSender, "tokenExpiryTime", System.currentTimeMillis() + 3600_000);

            stubSendMailEndpoint();

            MailMessage message = MailMessage.builder()
                    .from("sender@company.com")
                    .to("recipient@example.com")
                    .subject("Test Subject")
                    .htmlBody("<h1>Hello</h1>")
                    .build();

            mailSender.send(message);

            verify(postRequestedFor(urlPathMatching("/v1.0/users/.*/sendMail"))
                    .withRequestBody(containing("\"toRecipients\""))
                    .withRequestBody(containing("recipient@example.com"))
                    .withRequestBody(containing("\"subject\":\"Test Subject\""))
                    .withRequestBody(containing("\"contentType\":\"HTML\""))
                    .withRequestBody(containing("\"saveToSentItems\":true")));
        }

        @Test
        @DisplayName("sends token request with correct form data")
        void sendsTokenRequestWithCorrectFormData() {
            stubTokenEndpoint();
            stubSendMailEndpoint();

            mailSender.send(createSimpleMessage());

            verify(postRequestedFor(urlPathMatching(".*oauth2/v2.0/token"))
                    .withHeader(HttpHeaders.CONTENT_TYPE, containing(MediaType.APPLICATION_FORM_URLENCODED_VALUE))
                    .withRequestBody(containing("client_id=" + CLIENT_ID))
                    .withRequestBody(containing("client_secret=" + CLIENT_SECRET))
                    .withRequestBody(containing("grant_type=client_credentials"))
                    .withRequestBody(containing("scope=https%3A%2F%2Fgraph.microsoft.com%2F.default")));
        }

        @Test
        @DisplayName("when token acquisition fails → throws MailSendException")
        void whenTokenAcquisitionFailsThrowsMailSendException() {
            stubFor(post(urlPathMatching(".*oauth2/v2.0/token"))
                    .willReturn(aResponse()
                            .withStatus(401)
                            .withHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                            .withBody("""
                                    {
                                        "error": "invalid_client",
                                        "error_description": "Client authentication failed"
                                    }
                                    """)));

            assertThatThrownBy(() -> mailSender.send(createSimpleMessage()))
                    .isInstanceOf(MailSendException.class)
                    .hasMessageContaining("Failed to obtain access token");
        }

        @Test
        @DisplayName("when token response has no access token → throws MailSendException")
        void whenTokenResponseHasNoAccessTokenThrowsMailSendException() {
            stubFor(post(urlPathMatching(".*oauth2/v2.0/token"))
                    .willReturn(aResponse()
                            .withStatus(200)
                            .withHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                            .withBody("""
                                    {
                                        "expires_in": 3600,
                                        "token_type": "Bearer"
                                    }
                                    """)));

            assertThatThrownBy(() -> mailSender.send(createSimpleMessage()))
                    .isInstanceOf(MailSendException.class)
                    .hasMessageContaining("No access token in response");
        }

        @Test
        @DisplayName("when Graph API returns error → throws MailSendException")
        void whenGraphApiReturnsErrorThrowsMailSendException() {
            ReflectionTestUtils.setField(mailSender, "accessToken", VALID_ACCESS_TOKEN);
            ReflectionTestUtils.setField(mailSender, "tokenExpiryTime", System.currentTimeMillis() + 3600_000);

            stubFor(post(urlPathMatching("/v1.0/users/.*/sendMail"))
                    .willReturn(aResponse()
                            .withStatus(403)
                            .withHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                            .withBody("""
                                    {
                                        "error": {
                                            "code": "ErrorAccessDenied",
                                            "message": "Access denied"
                                        }
                                    }
                                    """)));

            assertThatThrownBy(() -> mailSender.send(createSimpleMessage()))
                    .isInstanceOf(MailSendException.class)
                    .hasMessageContaining("Microsoft Graph API returned status");
        }

        @Test
        @DisplayName("with attachments → base64 encodes content")
        void withAttachmentsBase64EncodesContent() {
            ReflectionTestUtils.setField(mailSender, "accessToken", VALID_ACCESS_TOKEN);
            ReflectionTestUtils.setField(mailSender, "tokenExpiryTime", System.currentTimeMillis() + 3600_000);

            stubSendMailEndpoint();

            byte[] pdfContent = "PDF file content".getBytes();
            String expectedBase64 = Base64.getEncoder().encodeToString(pdfContent);

            MailMessage message = MailMessage.builder()
                    .from("sender@company.com")
                    .to("recipient@example.com")
                    .subject("With PDF")
                    .plainTextBody("See attached.")
                    .attachment(MailAttachment.pdf("invoice.pdf", pdfContent))
                    .build();

            mailSender.send(message);

            verify(postRequestedFor(urlPathMatching("/v1.0/users/.*/sendMail"))
                    .withRequestBody(containing("\"contentBytes\":\"" + expectedBase64 + "\""))
                    .withRequestBody(containing("\"name\":\"invoice.pdf\"")));
        }

        @Test
        @DisplayName("with CC recipients → includes in request")
        void withCcRecipientsIncludesInRequest() {
            ReflectionTestUtils.setField(mailSender, "accessToken", VALID_ACCESS_TOKEN);
            ReflectionTestUtils.setField(mailSender, "tokenExpiryTime", System.currentTimeMillis() + 3600_000);

            stubSendMailEndpoint();

            MailMessage message = MailMessage.builder()
                    .from("sender@company.com")
                    .to("recipient@example.com")
                    .cc("manager@company.com")
                    .cc("admin@company.com")
                    .subject("With CC")
                    .plainTextBody("FYI")
                    .build();

            mailSender.send(message);

            verify(postRequestedFor(urlPathMatching("/v1.0/users/.*/sendMail"))
                    .withRequestBody(containing("\"ccRecipients\""))
                    .withRequestBody(containing("manager@company.com"))
                    .withRequestBody(containing("admin@company.com")));
        }

        @Test
        @DisplayName("when network error → throws MailSendException")
        void whenNetworkErrorThrowsMailSendException() {
            ReflectionTestUtils.setField(mailSender, "accessToken", VALID_ACCESS_TOKEN);
            ReflectionTestUtils.setField(mailSender, "tokenExpiryTime", System.currentTimeMillis() + 3600_000);

            stubFor(post(urlPathMatching("/v1.0/users/.*/sendMail"))
                    .willReturn(aResponse()
                            .withFault(com.github.tomakehurst.wiremock.http.Fault.CONNECTION_RESET_BY_PEER)));

            assertThatThrownBy(() -> mailSender.send(createSimpleMessage()))
                    .isInstanceOf(MailSendException.class)
                    .hasMessageContaining("Failed to send email via Microsoft Graph");
        }
    }

    @Nested
    @DisplayName("isAvailable()")
    class IsAvailableTests {

        @Test
        @DisplayName("returns true when all config provided")
        void returnsTrueWhenAllConfigProvided() {
            assertThat(mailSender.isAvailable()).isTrue();
        }

        @Test
        @DisplayName("returns false when tenantId is blank")
        void returnsFalseWhenTenantIdIsBlank() {
            GraphClientCredentialsMailSender sender = new GraphClientCredentialsMailSender(
                    "   ", CLIENT_ID, CLIENT_SECRET, SENDER_EMAIL
            );
            assertThat(sender.isAvailable()).isFalse();
        }

        @Test
        @DisplayName("returns false when tenantId is null")
        void returnsFalseWhenTenantIdIsNull() {
            GraphClientCredentialsMailSender sender = new GraphClientCredentialsMailSender(
                    null, CLIENT_ID, CLIENT_SECRET, SENDER_EMAIL
            );
            assertThat(sender.isAvailable()).isFalse();
        }

        @Test
        @DisplayName("returns false when clientId is blank")
        void returnsFalseWhenClientIdIsBlank() {
            GraphClientCredentialsMailSender sender = new GraphClientCredentialsMailSender(
                    TENANT_ID, "", CLIENT_SECRET, SENDER_EMAIL
            );
            assertThat(sender.isAvailable()).isFalse();
        }

        @Test
        @DisplayName("returns false when clientSecret is blank")
        void returnsFalseWhenClientSecretIsBlank() {
            GraphClientCredentialsMailSender sender = new GraphClientCredentialsMailSender(
                    TENANT_ID, CLIENT_ID, "   ", SENDER_EMAIL
            );
            assertThat(sender.isAvailable()).isFalse();
        }

        @Test
        @DisplayName("returns false when senderEmail is blank")
        void returnsFalseWhenSenderEmailIsBlank() {
            GraphClientCredentialsMailSender sender = new GraphClientCredentialsMailSender(
                    TENANT_ID, CLIENT_ID, CLIENT_SECRET, ""
            );
            assertThat(sender.isAvailable()).isFalse();
        }

        @Test
        @DisplayName("returns false when senderEmail is null")
        void returnsFalseWhenSenderEmailIsNull() {
            GraphClientCredentialsMailSender sender = new GraphClientCredentialsMailSender(
                    TENANT_ID, CLIENT_ID, CLIENT_SECRET, null
            );
            assertThat(sender.isAvailable()).isFalse();
        }
    }

    @Nested
    @DisplayName("getType()")
    class GetTypeTests {

        @Test
        @DisplayName("returns 'Microsoft Graph (Client Credentials)'")
        void returnsMicrosoftGraphClientCredentials() {
            assertThat(mailSender.getType()).isEqualTo("Microsoft Graph (Client Credentials)");
        }
    }
}
