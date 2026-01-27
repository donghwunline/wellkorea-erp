package com.wellkorea.backend.admin.mail.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

/**
 * Temporary state for OAuth2 CSRF protection.
 * States expire after 10 minutes to prevent replay attacks.
 */
@Entity
@Table(name = "mail_oauth2_state")
public class MailOAuth2State {

    private static final int STATE_TTL_MINUTES = 10;

    @Id
    @Column(length = 64)
    private String state;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    protected MailOAuth2State() {
        // JPA requires default constructor
    }

    public MailOAuth2State(Long userId) {
        this.state = UUID.randomUUID().toString();
        this.userId = Objects.requireNonNull(userId, "userId must not be null");
        this.expiresAt = Instant.now().plusSeconds(STATE_TTL_MINUTES * 60L);
    }

    public String getState() {
        return state;
    }

    public Long getUserId() {
        return userId;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public boolean isExpired() {
        return Instant.now().isAfter(expiresAt);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        MailOAuth2State that = (MailOAuth2State) o;
        return Objects.equals(state, that.state);
    }

    @Override
    public int hashCode() {
        return Objects.hash(state);
    }

    @Override
    public String toString() {
        return "MailOAuth2State{" +
                "state='" + state + '\'' +
                ", userId=" + userId +
                ", expiresAt=" + expiresAt +
                '}';
    }
}
