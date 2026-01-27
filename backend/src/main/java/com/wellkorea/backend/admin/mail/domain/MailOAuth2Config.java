package com.wellkorea.backend.admin.mail.domain;

import com.wellkorea.backend.shared.security.EncryptedStringConverter;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.Objects;

/**
 * Stores Microsoft Graph OAuth2 tokens for mail sending.
 * Uses singleton pattern - only one configuration can exist at a time.
 *
 * <p>Access tokens are cached in the database for scale-out deployments,
 * allowing multiple application instances to share the same token without
 * redundant refresh calls.
 */
@Entity
@Table(name = "mail_oauth2_config")
public class MailOAuth2Config {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Singleton constraint key - always "SINGLETON".
     * Ensures only one configuration can exist via unique constraint.
     */
    @Column(name = "config_key", nullable = false, updatable = false)
    private String configKey = "SINGLETON";

    @Column(name = "refresh_token", nullable = false, columnDefinition = "TEXT")
    @Convert(converter = EncryptedStringConverter.class)
    private String refreshToken;

    @Column(name = "sender_email")
    private String senderEmail;

    @Column(name = "connected_by_id", nullable = false)
    private Long connectedById;

    @Column(name = "connected_at", nullable = false)
    private Instant connectedAt;

    /**
     * Cached access token for Graph API calls.
     * Stored in database for sharing across multiple application instances.
     */
    @Column(name = "access_token", columnDefinition = "TEXT")
    private String accessToken;

    /**
     * Access token expiry timestamp.
     * Token should be refreshed before this time.
     */
    @Column(name = "token_expires_at")
    private Instant tokenExpiresAt;

    /**
     * Last successful token refresh timestamp.
     * Used for monitoring and debugging.
     */
    @Column(name = "last_refresh_at")
    private Instant lastRefreshAt;

    /**
     * Timestamp when refresh token was last rotated.
     * Microsoft may return a new refresh token during token refresh.
     */
    @Column(name = "refresh_token_rotated_at")
    private Instant refreshTokenRotatedAt;

    protected MailOAuth2Config() {
        // JPA requires default constructor
    }

    public MailOAuth2Config(String refreshToken, String senderEmail, Long connectedById) {
        this.refreshToken = Objects.requireNonNull(refreshToken, "refreshToken must not be null");
        this.senderEmail = senderEmail;
        this.connectedById = Objects.requireNonNull(connectedById, "connectedById must not be null");
        this.connectedAt = Instant.now();
    }

    /**
     * Update tokens after OAuth callback (initial connection or reconnection).
     */
    public void updateTokens(String refreshToken, String senderEmail, Long connectedById) {
        this.refreshToken = Objects.requireNonNull(refreshToken, "refreshToken must not be null");
        this.senderEmail = senderEmail;
        this.connectedById = Objects.requireNonNull(connectedById, "connectedById must not be null");
        this.connectedAt = Instant.now();
        // Clear cached access token to force refresh
        this.accessToken = null;
        this.tokenExpiresAt = null;
    }

    /**
     * Update cached access token after successful refresh.
     *
     * @param accessToken The new access token
     * @param expiresAt When the token expires
     */
    public void updateAccessToken(String accessToken, Instant expiresAt) {
        this.accessToken = Objects.requireNonNull(accessToken, "accessToken must not be null");
        this.tokenExpiresAt = Objects.requireNonNull(expiresAt, "expiresAt must not be null");
        this.lastRefreshAt = Instant.now();
    }

    /**
     * Check if the cached access token is still valid.
     * Returns false if no token exists or if it expires within 60 seconds.
     */
    public boolean hasValidAccessToken() {
        return accessToken != null
                && tokenExpiresAt != null
                && Instant.now().isBefore(tokenExpiresAt.minusSeconds(60));
    }

    /**
     * Rotate the refresh token when Microsoft returns a new one.
     * This implements token rotation security best practice.
     *
     * @param newRefreshToken the new refresh token from Microsoft
     */
    public void rotateRefreshToken(String newRefreshToken) {
        this.refreshToken = Objects.requireNonNull(newRefreshToken, "newRefreshToken must not be null");
        this.refreshTokenRotatedAt = Instant.now();
    }

    // Getters

    public Long getId() {
        return id;
    }

    public String getConfigKey() {
        return configKey;
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

    public String getAccessToken() {
        return accessToken;
    }

    public Instant getTokenExpiresAt() {
        return tokenExpiresAt;
    }

    public Instant getLastRefreshAt() {
        return lastRefreshAt;
    }

    public Instant getRefreshTokenRotatedAt() {
        return refreshTokenRotatedAt;
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
                ", hasAccessToken=" + (accessToken != null) +
                ", tokenExpiresAt=" + tokenExpiresAt +
                '}';
    }
}
