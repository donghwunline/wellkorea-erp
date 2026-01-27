package com.wellkorea.backend.admin.mail.application;

import com.wellkorea.backend.admin.mail.domain.MailOAuth2Config;
import com.wellkorea.backend.admin.mail.domain.MailOAuth2State;
import com.wellkorea.backend.admin.mail.infrastructure.MailOAuth2ConfigRepository;
import com.wellkorea.backend.admin.mail.infrastructure.MailOAuth2StateRepository;
import com.wellkorea.backend.shared.exception.BusinessException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
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
    private final HttpClient httpClient;

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
        this.httpClient = HttpClient.newHttpClient();
    }

    /**
     * Get the current OAuth2 connection status.
     */
    @Transactional(readOnly = true)
    public MailConfigStatus getStatus() {
        Optional<MailOAuth2Config> config = configRepository.findFirstByOrderByConnectedAtDesc();

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

        // Clean up expired states
        stateRepository.deleteExpiredStates(Instant.now());

        // Create new state
        MailOAuth2State state = new MailOAuth2State(userId);
        stateRepository.save(state);

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
     */
    @Transactional
    public void handleCallback(String code, String stateValue) {
        validateMicrosoftConfig();

        // Validate state
        MailOAuth2State state = stateRepository.findById(stateValue)
                .orElseThrow(() -> new BusinessException("Invalid OAuth2 state parameter"));

        if (state.isExpired()) {
            stateRepository.delete(state);
            throw new BusinessException("OAuth2 state has expired. Please try again.");
        }

        // Exchange code for tokens
        String requestBody = "client_id=" + encode(clientId) +
                "&client_secret=" + encode(clientSecret) +
                "&code=" + encode(code) +
                "&redirect_uri=" + encode(getRedirectUri()) +
                "&grant_type=authorization_code" +
                "&scope=" + encode(SCOPE);

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(TOKEN_URL))
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                String body = response.body();
                String refreshToken = extractJsonValue(body, "refresh_token");

                if (refreshToken == null || refreshToken.isBlank()) {
                    throw new BusinessException("No refresh token received from Microsoft");
                }

                // Delete existing configs and save new one
                configRepository.deleteAll();
                MailOAuth2Config config = new MailOAuth2Config(
                        refreshToken,
                        null, // sender email could be fetched from Graph API if needed
                        state.getUserId()
                );
                configRepository.save(config);

                // Clean up state
                stateRepository.delete(state);

                log.info("Mail OAuth2 configured successfully by user {}", state.getUserId());
            } else {
                log.error("Token exchange failed: {}", response.body());
                throw new BusinessException("Failed to exchange authorization code: " + extractErrorMessage(response.body()));
            }

        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("OAuth2 callback processing failed", e);
            throw new BusinessException("Failed to process OAuth2 callback: " + e.getMessage());
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
        return configRepository.findFirstByOrderByConnectedAtDesc()
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
            throw new BusinessException(
                    "Microsoft Graph is not configured. Set MICROSOFT_GRAPH_CLIENT_ID and MICROSOFT_GRAPH_CLIENT_SECRET.");
        }
    }

    private String getRedirectUri() {
        return baseUrl + "/api/admin/mail/oauth2/callback";
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private String extractJsonValue(String json, String key) {
        String searchKey = "\"" + key + "\":";
        int start = json.indexOf(searchKey);
        if (start == -1) return null;
        start += searchKey.length();

        // Skip whitespace
        while (start < json.length() && Character.isWhitespace(json.charAt(start))) {
            start++;
        }

        if (start >= json.length()) return null;

        if (json.charAt(start) == '"') {
            start++;
            int end = json.indexOf("\"", start);
            return end > start ? json.substring(start, end) : null;
        } else {
            int end = json.indexOf(",", start);
            if (end == -1) end = json.indexOf("}", start);
            return end > start ? json.substring(start, end).trim() : null;
        }
    }

    private String extractErrorMessage(String json) {
        String desc = extractJsonValue(json, "error_description");
        if (desc != null) return desc;
        String error = extractJsonValue(json, "error");
        return error != null ? error : "Unknown error";
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
