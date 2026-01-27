package com.wellkorea.backend.admin.mail.application;

import com.wellkorea.backend.admin.mail.domain.MailOAuth2Config;
import com.wellkorea.backend.admin.mail.domain.MailOAuth2State;
import com.wellkorea.backend.admin.mail.infrastructure.MailOAuth2ConfigRepository;
import com.wellkorea.backend.admin.mail.infrastructure.MailOAuth2StateRepository;
import com.wellkorea.backend.shared.exception.ErrorCode;
import com.wellkorea.backend.shared.exception.OAuth2Exception;
import com.wellkorea.backend.shared.mail.dto.MicrosoftTokenResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Optional;

/**
 * Service for managing Microsoft Graph OAuth2 configuration.
 * Handles authorization URL generation, callback processing, and token storage.
 */
@Service
public class MailOAuth2Service {

    private static final Logger log = LoggerFactory.getLogger(MailOAuth2Service.class);
    private static final String AUTH_URL = "https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize";
    private static final String TOKEN_URL = "https://login.microsoftonline.com/consumers/oauth2/v2.0/token";
    private static final String SCOPE = "offline_access Mail.Send";

    private final MailOAuth2ConfigRepository configRepository;
    private final MailOAuth2StateRepository stateRepository;
    private final RestClient restClient;

    @Value("${microsoft.graph.client-id:}")
    private String clientId;

    @Value("${microsoft.graph.client-secret:}")
    private String clientSecret;

    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;

    public MailOAuth2Service(MailOAuth2ConfigRepository configRepository,
                             MailOAuth2StateRepository stateRepository) {
        this.configRepository = configRepository;
        this.stateRepository = stateRepository;
        this.restClient = RestClient.create();
    }

    /**
     * Get the current OAuth2 connection status.
     */
    @Transactional(readOnly = true)
    public MailConfigStatus getStatus() {
        Optional<MailOAuth2Config> config = configRepository.findSingletonConfig();

        if (config.isPresent()) {
            MailOAuth2Config c = config.get();
            return new MailConfigStatus(
                    true,
                    c.getSenderEmail(),
                    c.getConnectedAt(),
                    c.getConnectedById()
            );
        }

        return new MailConfigStatus(false, null, null, null);
    }

    /**
     * Generate Microsoft OAuth2 authorization URL.
     * Creates and stores a state parameter for CSRF protection.
     */
    @Transactional
    public String generateAuthorizationUrl(Long userId) {
        validateMicrosoftConfig();

        // Create and save new state FIRST (before cleanup to avoid race condition)
        MailOAuth2State state = new MailOAuth2State(userId);
        stateRepository.save(state);

        // Clean up expired states AFTER saving new state (with 60-second grace period)
        // Grace period ensures newly created states aren't accidentally deleted
        stateRepository.deleteExpiredStates(Instant.now().minusSeconds(60));

        String redirectUri = getRedirectUri();

        return AUTH_URL +
                "?client_id=" + encode(clientId) +
                "&response_type=code" +
                "&redirect_uri=" + encode(redirectUri) +
                "&response_mode=query" +
                "&scope=" + encode(SCOPE) +
                "&state=" + encode(state.getState());
    }

    /**
     * Handle OAuth2 callback - exchange code for tokens and store refresh token.
     * Uses upsert pattern to maintain singleton constraint.
     *
     * @throws OAuth2Exception with error codes for redirect handling
     */
    @Transactional
    public void handleCallback(String code, String stateValue) {
        validateMicrosoftConfig();

        // Validate code parameter
        if (code == null || code.isBlank()) {
            throw new OAuth2Exception(ErrorCode.OAUTH_INVALID_CODE);
        }
        if (code.length() > 2048) {  // Microsoft codes are typically < 1KB
            throw new OAuth2Exception(ErrorCode.OAUTH_INVALID_CODE);
        }

        // Validate state parameter
        if (stateValue == null || stateValue.isBlank()) {
            throw new OAuth2Exception(ErrorCode.OAUTH_INVALID_STATE);
        }

        // Validate state exists and is not expired
        MailOAuth2State state = stateRepository.findById(stateValue)
                .orElseThrow(() -> new OAuth2Exception(ErrorCode.OAUTH_INVALID_STATE));

        if (state.isExpired()) {
            stateRepository.delete(state);
            throw new OAuth2Exception(ErrorCode.OAUTH_STATE_EXPIRED);
        }

        // Exchange code for tokens
        MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
        formData.add("client_id", clientId);
        formData.add("client_secret", clientSecret);
        formData.add("code", code);
        formData.add("redirect_uri", getRedirectUri());
        formData.add("grant_type", "authorization_code");
        formData.add("scope", SCOPE);

        try {
            MicrosoftTokenResponse response = restClient.post()
                    .uri(TOKEN_URL)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(formData)
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, (req, res) -> {
                        log.error("Token exchange failed: status={}", res.getStatusCode());
                        throw new OAuth2Exception(ErrorCode.OAUTH_TOKEN_EXCHANGE_FAILED);
                    })
                    .body(MicrosoftTokenResponse.class);

            if (response == null || response.refreshToken() == null || response.refreshToken().isBlank()) {
                throw new OAuth2Exception(ErrorCode.OAUTH_NO_REFRESH_TOKEN);
            }

            // Upsert pattern: update existing or create new (maintains singleton)
            MailOAuth2Config config = configRepository.findSingletonConfig()
                    .orElseGet(() -> new MailOAuth2Config(
                            response.refreshToken(),
                            null,
                            state.getUserId()
                    ));

            config.updateTokens(response.refreshToken(), null, state.getUserId());
            configRepository.save(config);

            // Clean up state
            stateRepository.delete(state);

            log.info("Mail OAuth2 configured successfully by user {}", state.getUserId());

        } catch (OAuth2Exception e) {
            throw e;
        } catch (RestClientException e) {
            log.error("HTTP error during token exchange", e);
            throw new OAuth2Exception(ErrorCode.OAUTH_TOKEN_EXCHANGE_FAILED, e);
        } catch (DataAccessException e) {
            log.error("Database error during OAuth callback", e);
            throw new OAuth2Exception(ErrorCode.OAUTH_DATABASE_ERROR, e);
        } catch (Exception e) {
            log.error("Unexpected error during OAuth callback", e);
            throw new OAuth2Exception(ErrorCode.INTERNAL_SERVER_ERROR, e);
        }
    }

    /**
     * Disconnect mail OAuth2 - remove stored configuration.
     */
    @Transactional
    public void disconnect() {
        configRepository.deleteAll();
        log.info("Mail OAuth2 configuration disconnected");
    }

    /**
     * Get the stored refresh token, if available.
     */
    @Transactional(readOnly = true)
    public Optional<String> getRefreshToken() {
        return configRepository.findSingletonConfig()
                .map(MailOAuth2Config::getRefreshToken);
    }

    /**
     * Check if Microsoft Graph is configured (client ID and secret are set).
     */
    public boolean isMicrosoftConfigured() {
        return clientId != null && !clientId.isBlank()
                && clientSecret != null && !clientSecret.isBlank();
    }

    private void validateMicrosoftConfig() {
        if (!isMicrosoftConfigured()) {
            throw new OAuth2Exception(ErrorCode.OAUTH_CONFIG_MISSING);
        }
    }

    private String getRedirectUri() {
        return baseUrl + "/api/admin/mail/oauth2/callback";
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    /**
     * Status record for mail OAuth2 configuration.
     */
    public record MailConfigStatus(
            boolean connected,
            String senderEmail,
            Instant connectedAt,
            Long connectedById
    ) {}
}
