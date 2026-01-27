package com.wellkorea.backend.admin.mail.infrastructure;

import com.wellkorea.backend.admin.mail.domain.MailOAuth2State;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;

/**
 * Repository for OAuth2 state management.
 */
@Repository
public interface MailOAuth2StateRepository extends JpaRepository<MailOAuth2State, String> {

    /**
     * Delete expired states to prevent table bloat.
     */
    @Modifying
    @Query("DELETE FROM MailOAuth2State s WHERE s.expiresAt < :now")
    void deleteExpiredStates(Instant now);
}
