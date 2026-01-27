package com.wellkorea.backend.shared.mail;

import com.wellkorea.backend.admin.mail.domain.MailOAuth2Config;
import com.wellkorea.backend.admin.mail.infrastructure.MailOAuth2ConfigRepository;
import com.wellkorea.backend.shared.mail.dto.MicrosoftTokenResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.time.Instant;

/**
 * Service for refreshing Microsoft Graph OAuth2 tokens.
 * Provides proper transaction boundaries for atomic token updates.
 *
 * <p>This service is separate from GraphMailSender to ensure database
 * operations are properly transactional when called from within the
 * distributed lock.
 */
@Service
public class MailTokenRefreshService {

    private static final Logger log = LoggerFactory.getLogger(MailTokenRefreshService.class);
    private static final String TOKEN_URL = "https://login.microsoftonline.com/consumers/oauth2/v2.0/token";

    private final MailOAuth2ConfigRepository configRepository;
    private final RestClient restClient;

    public MailTokenRefreshService(MailOAuth2ConfigRepository configRepository) {
        this.configRepository = configRepository;
        this.restClient = RestClient.create();
    }

    /**
     * Refreshes the access token and optionally rotates the refresh token.
     * This method is transactional to ensure atomic updates to the database.
     *
     * @param config the OAuth2 config to refresh
     * @param clientId Microsoft app client ID
     * @param clientSecret Microsoft app client secret
     * @return the new access token
     * @throws MailSendException if token refresh fails
     */
    @Transactional
    public String refreshToken(MailOAuth2Config config, String clientId, String clientSecret) {
        log.debug("Refreshing access token");

        MicrosoftTokenResponse response = exchangeRefreshToken(config, clientId, clientSecret);

        // Update access token
        Instant expiresAt = Instant.now().plusSeconds(response.expiresIn());
        config.updateAccessToken(response.accessToken(), expiresAt);

        // Handle refresh token rotation if Microsoft returns a new one
        if (response.refreshToken() != null && !response.refreshToken().isBlank()) {
            log.info("Microsoft returned new refresh token, rotating");
            config.rotateRefreshToken(response.refreshToken());
        }

        configRepository.save(config);

        log.debug("Access token refreshed, expires at {}", expiresAt);
        return response.accessToken();
    }

    private MicrosoftTokenResponse exchangeRefreshToken(MailOAuth2Config config, String clientId, String clientSecret) {
        MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
        formData.add("client_id", clientId);
        formData.add("client_secret", clientSecret);
        formData.add("refresh_token", config.getRefreshToken());
        formData.add("grant_type", "refresh_token");
        formData.add("scope", "Mail.Send offline_access");

        try {
            MicrosoftTokenResponse response = restClient.post()
                    .uri(TOKEN_URL)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(formData)
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, (req, res) -> {
                        throw new MailSendException("Token refresh failed: " + res.getStatusCode());
                    })
                    .body(MicrosoftTokenResponse.class);

            if (response == null || response.accessToken() == null) {
                throw new MailSendException("No access token in refresh response");
            }

            return response;

        } catch (MailSendException e) {
            throw e;
        } catch (Exception e) {
            throw new MailSendException("Failed to refresh access token: " + e.getMessage(), e);
        }
    }
}
