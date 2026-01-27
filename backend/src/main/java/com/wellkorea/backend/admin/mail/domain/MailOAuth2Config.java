package com.wellkorea.backend.admin.mail.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.Objects;

/**
 * Stores Microsoft Graph OAuth2 refresh token for mail sending.
 * Only one active configuration should exist at a time.
 */
@Entity
@Table(name = "mail_oauth2_config")
public class MailOAuth2Config {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "refresh_token", nullable = false, columnDefinition = "TEXT")
    private String refreshToken;

    @Column(name = "sender_email")
    private String senderEmail;

    @Column(name = "connected_by_id", nullable = false)
    private Long connectedById;

    @Column(name = "connected_at", nullable = false)
    private Instant connectedAt;

    protected MailOAuth2Config() {
        // JPA requires default constructor
    }

    public MailOAuth2Config(String refreshToken, String senderEmail, Long connectedById) {
        this.refreshToken = Objects.requireNonNull(refreshToken, "refreshToken must not be null");
        this.senderEmail = senderEmail;
        this.connectedById = Objects.requireNonNull(connectedById, "connectedById must not be null");
        this.connectedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public String getRefreshToken() {
        return refreshToken;
    }

    public String getSenderEmail() {
        return senderEmail;
    }

    public Long getConnectedById() {
        return connectedById;
    }

    public Instant getConnectedAt() {
        return connectedAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        MailOAuth2Config that = (MailOAuth2Config) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "MailOAuth2Config{" +
                "id=" + id +
                ", senderEmail='" + senderEmail + '\'' +
                ", connectedById=" + connectedById +
                ", connectedAt=" + connectedAt +
                '}';
    }
}
