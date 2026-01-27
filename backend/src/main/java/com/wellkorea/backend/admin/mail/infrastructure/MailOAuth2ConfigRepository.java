package com.wellkorea.backend.admin.mail.infrastructure;

import com.wellkorea.backend.admin.mail.domain.MailOAuth2Config;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for mail OAuth2 configuration.
 */
@Repository
public interface MailOAuth2ConfigRepository extends JpaRepository<MailOAuth2Config, Long> {

    /**
     * Find the most recently connected configuration.
     * Used as the active mail configuration.
     */
    Optional<MailOAuth2Config> findFirstByOrderByConnectedAtDesc();
}
