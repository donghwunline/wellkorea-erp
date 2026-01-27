package com.wellkorea.backend.shared.mail;

import com.wellkorea.backend.shared.mail.dto.GraphMailRequest;
import com.wellkorea.backend.shared.mail.dto.GraphMailRequest.GraphAttachment;
import com.wellkorea.backend.shared.mail.dto.GraphMailRequest.GraphBody;
import com.wellkorea.backend.shared.mail.dto.GraphMailRequest.GraphEmailAddress;
import com.wellkorea.backend.shared.mail.dto.GraphMailRequest.GraphMessage;
import com.wellkorea.backend.shared.mail.dto.GraphMailRequest.GraphRecipient;
import com.wellkorea.backend.shared.mail.dto.MicrosoftTokenResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Collections;
import java.util.List;

/**
 * Microsoft Graph API implementation of MailSender using Client Credentials flow.
 * Suitable for Microsoft 365 organization accounts (server-to-server communication).
 *
 * <p>Note: Client Credentials flow doesn't require distributed locking because
 * each instance can independently obtain its own access token - there's no shared
 * refresh token that gets invalidated upon use.
 *
 * <p>Required configuration properties:
 * <ul>
 *     <li>microsoft.graph.tenant-id - Azure AD tenant ID</li>
 *     <li>microsoft.graph.client-id - Azure AD app client ID</li>
 *     <li>microsoft.graph.client-secret - Azure AD app client secret</li>
 *     <li>microsoft.graph.sender-email - Sender email address (must be valid mailbox in tenant)</li>
 * </ul>
 *
 * <p>Azure AD Setup Requirements:
 * <ol>
 *     <li>Register app in Azure Portal - App registrations</li>
 *     <li>Add API permission: Microsoft Graph - Application - Mail.Send</li>
 *     <li>Grant admin consent for the permission</li>
 *     <li>Create client secret under Certificates &amp; secrets</li>
 * </ol>
 */
public class GraphClientCredentialsMailSender implements MailSender {

    private static final Logger log = LoggerFactory.getLogger(GraphClientCredentialsMailSender.class);
    private static final String GRAPH_API_BASE = "https://graph.microsoft.com/v1.0";
    private static final String TOKEN_URL_TEMPLATE = "https://login.microsoftonline.com/%s/oauth2/v2.0/token";

    private final String tenantId;
    private final String clientId;
    private final String clientSecret;
    private final String senderEmail;
    private final RestClient restClient;

    // In-memory token cache (safe for client credentials - each instance can refresh independently)
    private String accessToken;
    private long tokenExpiryTime;

    public GraphClientCredentialsMailSender(String tenantId, String clientId, String clientSecret, String senderEmail) {
        this.tenantId = tenantId;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.senderEmail = senderEmail;
        this.restClient = RestClient.create();
    }

    @Override
    public void send(MailMessage message) {
        ensureValidAccessToken();

        String sendMailUrl = String.format("%s/users/%s/sendMail", GRAPH_API_BASE,
                URLEncoder.encode(senderEmail, StandardCharsets.UTF_8));

        GraphMailRequest request = buildMailRequest(message);

        try {
            restClient.post()
                    .uri(sendMailUrl)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, (req, res) -> {
                        throw new MailSendException("Microsoft Graph API returned status " + res.getStatusCode());
                    })
                    .toBodilessEntity();

            log.info("Graph (Client Credentials): Sent email from {} to {} (cc: {}) with subject: {}",
                    senderEmail, message.to(), message.cc().size(), message.subject());

        } catch (MailSendException e) {
            throw e;
        } catch (Exception e) {
            throw new MailSendException("Failed to send email via Microsoft Graph: " + e.getMessage(), e);
        }
    }

    private synchronized void ensureValidAccessToken() {
        if (accessToken == null || System.currentTimeMillis() >= tokenExpiryTime) {
            obtainAccessToken();
        }
    }

    private void obtainAccessToken() {
        String tokenUrl = String.format(TOKEN_URL_TEMPLATE, tenantId);

        MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
        formData.add("client_id", clientId);
        formData.add("client_secret", clientSecret);
        formData.add("scope", "https://graph.microsoft.com/.default");
        formData.add("grant_type", "client_credentials");

        try {
            MicrosoftTokenResponse response = restClient.post()
                    .uri(tokenUrl)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(formData)
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, (req, res) -> {
                        throw new MailSendException("Failed to obtain access token: " + res.getStatusCode());
                    })
                    .body(MicrosoftTokenResponse.class);

            if (response == null || response.accessToken() == null) {
                throw new MailSendException("No access token in response");
            }

            accessToken = response.accessToken();
            tokenExpiryTime = System.currentTimeMillis() + (response.expiresIn() - 60) * 1000L;
            log.debug("Graph (Client Credentials): Access token obtained, expires in {} seconds", response.expiresIn());

        } catch (MailSendException e) {
            throw e;
        } catch (Exception e) {
            throw new MailSendException("Failed to obtain access token: " + e.getMessage(), e);
        }
    }

    private GraphMailRequest buildMailRequest(MailMessage msg) {
        List<GraphRecipient> toRecipients = List.of(toRecipient(msg.to()));
        List<GraphRecipient> ccRecipients = msg.cc().stream()
                .map(this::toRecipient)
                .toList();

        List<GraphAttachment> attachments = msg.attachments().isEmpty()
                ? Collections.emptyList()
                : msg.attachments().stream()
                .map(this::toAttachment)
                .toList();

        GraphMessage message = new GraphMessage(
                msg.subject(),
                new GraphBody(msg.html() ? "HTML" : "Text", msg.body()),
                toRecipients,
                ccRecipients.isEmpty() ? null : ccRecipients,
                attachments.isEmpty() ? null : attachments
        );

        return new GraphMailRequest(message, true);
    }

    private GraphRecipient toRecipient(String email) {
        return new GraphRecipient(new GraphEmailAddress(email));
    }

    private GraphAttachment toAttachment(MailAttachment attachment) {
        String base64Content = Base64.getEncoder().encodeToString(attachment.content());
        return GraphAttachment.fileAttachment(
                attachment.filename(),
                attachment.contentType(),
                base64Content
        );
    }

    @Override
    public boolean isAvailable() {
        return tenantId != null && !tenantId.isBlank()
                && clientId != null && !clientId.isBlank()
                && clientSecret != null && !clientSecret.isBlank()
                && senderEmail != null && !senderEmail.isBlank();
    }

    @Override
    public String getType() {
        return "Microsoft Graph (Client Credentials)";
    }
}
