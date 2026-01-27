package com.wellkorea.backend.shared.mail;

import java.util.Optional;

/**
 * Provider interface for Microsoft Graph refresh tokens.
 * Implementations can provide tokens from various sources (DB, env var, etc.).
 */
@FunctionalInterface
public interface RefreshTokenProvider {

    /**
     * Get the current refresh token.
     *
     * @return the refresh token, or empty if not available
     */
    Optional<String> getRefreshToken();

    /**
     * Check if a refresh token is available.
     */
    default boolean hasToken() {
        return getRefreshToken().isPresent();
    }
}
