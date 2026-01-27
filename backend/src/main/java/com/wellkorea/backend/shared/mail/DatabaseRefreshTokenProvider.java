package com.wellkorea.backend.shared.mail;

import com.wellkorea.backend.admin.mail.domain.MailOAuth2Config;
import com.wellkorea.backend.admin.mail.infrastructure.MailOAuth2ConfigRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Optional;

/**
 * Provides refresh tokens from database with environment variable fallback.
 * Database takes priority; if no DB config exists, falls back to env var.
 */
public class DatabaseRefreshTokenProvider implements RefreshTokenProvider {

    private static final Logger log = LoggerFactory.getLogger(DatabaseRefreshTokenProvider.class);

    private final MailOAuth2ConfigRepository configRepository;
    private final String fallbackToken;

    public DatabaseRefreshTokenProvider(MailOAuth2ConfigRepository configRepository, String fallbackToken) {
        this.configRepository = configRepository;
        this.fallbackToken = fallbackToken;
    }

    @Override
    public Optional<String> getRefreshToken() {
        // Try database first
        Optional<MailOAuth2Config> dbConfig = configRepository.findFirstByOrderByConnectedAtDesc();
        if (dbConfig.isPresent()) {
            log.debug("Using refresh token from database");
            return Optional.of(dbConfig.get().getRefreshToken());
        }

        // Fall back to environment variable
        if (fallbackToken != null && !fallbackToken.isBlank()) {
            log.debug("Using refresh token from environment variable");
            return Optional.of(fallbackToken);
        }

        log.debug("No refresh token available");
        return Optional.empty();
    }
}
