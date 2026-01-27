package com.wellkorea.backend.shared.mail;

import com.wellkorea.backend.admin.mail.domain.MailOAuth2Config;
import com.wellkorea.backend.admin.mail.infrastructure.MailOAuth2ConfigRepository;
import com.wellkorea.backend.shared.mail.dto.GraphMailRequest;
import com.wellkorea.backend.shared.mail.dto.GraphMailRequest.GraphAttachment;
import com.wellkorea.backend.shared.mail.dto.GraphMailRequest.GraphBody;
import com.wellkorea.backend.shared.mail.dto.GraphMailRequest.GraphEmailAddress;
import com.wellkorea.backend.shared.mail.dto.GraphMailRequest.GraphMessage;
import com.wellkorea.backend.shared.mail.dto.GraphMailRequest.GraphRecipient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestClient;

import java.util.Base64;
import java.util.Collections;
import java.util.List;

/**
 * Microsoft Graph API implementation of MailSender.
 * Uses OAuth2 Delegated Permissions (Authorization Code flow with refresh tokens)
 * for personal Microsoft accounts (hotmail.com, outlook.com).
 *
 * <p>Scale-out ready: Access tokens are cached in database and refreshed
 * using distributed locks to prevent race conditions across multiple instances.
 *
 * <p>Required configuration:
 * <ul>
 *     <li>microsoft.graph.client-id - Azure AD app client ID</li>
 *     <li>microsoft.graph.client-secret - Azure AD app client secret</li>
 *     <li>Database OAuth2 config via admin UI</li>
 * </ul>
 */
public class GraphMailSender implements MailSender {

    private static final Logger log = LoggerFactory.getLogger(GraphMailSender.class);
    private static final String GRAPH_SEND_MAIL_URL = "https://graph.microsoft.com/v1.0/me/sendMail";

    private final String clientId;
    private final String clientSecret;
    private final MailOAuth2ConfigRepository configRepository;
    private final MailTokenLockService lockService;
    private final MailTokenRefreshService tokenRefreshService;
    private final RestClient restClient;

    public GraphMailSender(
            String clientId,
            String clientSecret,
            MailOAuth2ConfigRepository configRepository,
            MailTokenLockService lockService,
            MailTokenRefreshService tokenRefreshService) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.configRepository = configRepository;
        this.lockService = lockService;
        this.tokenRefreshService = tokenRefreshService;
        this.restClient = RestClient.create();
    }

    @Override
    public void send(MailMessage message) {
        String accessToken = getValidAccessToken();

        GraphMailRequest request = buildMailRequest(message);

        try {
            restClient.post()
                    .uri(GRAPH_SEND_MAIL_URL)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, (req, res) -> {
                        throw new MailSendException("Microsoft Graph API returned status " + res.getStatusCode());
                    })
                    .toBodilessEntity();

            log.info("Graph: Sent email to {} (cc: {}) with subject: {}",
                    message.to(), message.cc().size(), message.subject());

        } catch (MailSendException e) {
            throw e;
        } catch (Exception e) {
            throw new MailSendException("Failed to send email via Microsoft Graph: " + e.getMessage(), e);
        }
    }

    /**
     * Get a valid access token, refreshing if necessary.
     * Uses double-checked locking pattern for efficiency.
     */
    private String getValidAccessToken() {
        MailOAuth2Config config = configRepository.findSingletonConfig()
                .orElseThrow(() -> new MailSendException(
                        "No OAuth2 config. Configure via admin settings."));

        // Fast path: check if cached token is still valid (no lock needed)
        if (config.hasValidAccessToken()) {
            return config.getAccessToken();
        }

        // Slow path: refresh with distributed lock
        return lockService.executeWithLock(() -> {
            // Re-check after acquiring lock (another instance may have refreshed)
            MailOAuth2Config freshConfig = configRepository.findSingletonConfig()
                    .orElseThrow(() -> new MailSendException("Config disappeared during refresh"));

            if (freshConfig.hasValidAccessToken()) {
                log.debug("Another instance refreshed the token, using cached value");
                return freshConfig.getAccessToken();
            }

            // Delegate to transactional service for proper transaction boundaries
            return tokenRefreshService.refreshToken(freshConfig, clientId, clientSecret);
        });
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
        return clientId != null && !clientId.isBlank()
                && clientSecret != null && !clientSecret.isBlank()
                && configRepository.findSingletonConfig().isPresent();
    }

    @Override
    public String getType() {
        return "Microsoft Graph";
    }
}
