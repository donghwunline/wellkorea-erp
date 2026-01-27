package com.wellkorea.backend.shared.mail;

import com.wellkorea.backend.admin.mail.domain.MailOAuth2Config;
import com.wellkorea.backend.admin.mail.infrastructure.MailOAuth2ConfigRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Optional;

/**
 * Provides refresh tokens from database storage.
 * Tokens are configured via the in-app OAuth2 flow (Admin Settings > Mail).
 */
public class DatabaseRefreshTokenProvider implements RefreshTokenProvider {

    private static final Logger log = LoggerFactory.getLogger(DatabaseRefreshTokenProvider.class);

    private final MailOAuth2ConfigRepository configRepository;

    public DatabaseRefreshTokenProvider(MailOAuth2ConfigRepository configRepository) {
        this.configRepository = configRepository;
    }

    @Override
    public Optional<String> getRefreshToken() {
        Optional<MailOAuth2Config> dbConfig = configRepository.findFirstByOrderByConnectedAtDesc();
        if (dbConfig.isPresent()) {
            log.debug("Using refresh token from database");
            return Optional.of(dbConfig.get().getRefreshToken());
        }

        log.debug("No refresh token available - configure via Admin Settings > Mail");
        return Optional.empty();
    }
}
