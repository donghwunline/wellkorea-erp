package com.wellkorea.backend.admin.mail.infrastructure;

import com.wellkorea.backend.admin.mail.domain.MailOAuth2Config;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for mail OAuth2 configuration.
 * Only one configuration (singleton) should exist at a time.
 */
@Repository
public interface MailOAuth2ConfigRepository extends JpaRepository<MailOAuth2Config, Long> {

    /**
     * Find the singleton configuration.
     * Uses the configKey constraint to ensure uniqueness.
     */
    @Query("SELECT c FROM MailOAuth2Config c WHERE c.configKey = 'SINGLETON'")
    Optional<MailOAuth2Config> findSingletonConfig();

    /**
     * Find the most recently connected configuration.
     * @deprecated Use {@link #findSingletonConfig()} instead for singleton pattern.
     */
    @Deprecated
    Optional<MailOAuth2Config> findFirstByOrderByConnectedAtDesc();
}
