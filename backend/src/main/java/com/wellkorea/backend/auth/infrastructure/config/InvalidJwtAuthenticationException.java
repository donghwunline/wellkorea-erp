package com.wellkorea.backend.auth.infrastructure.config;

/**
 * Exception thrown when JWT token is invalid (malformed, tampered, or null).
 * Maps to AUTH_002 error code.
 * <p>
 * TEMPORARY: This class will be replaced with OAuth2 authentication when
 * Keycloak integration is implemented. See docs/keycloak-migration.md.
 */
public class InvalidJwtAuthenticationException extends JwtAuthenticationException {

    public InvalidJwtAuthenticationException(String message) {
        super(message);
    }

    public InvalidJwtAuthenticationException(String message, Throwable cause) {
        super(message, cause);
    }
}
