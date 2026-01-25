package com.wellkorea.backend.shared.exception;

/**
 * Exception thrown when JWT token is expired.
 * Maps to AUTH_003 error code.
 * <p>
 * TEMPORARY: This class will be replaced with OAuth2 authentication when
 * Keycloak integration is implemented. See docs/keycloak-migration.md.
 */
public class ExpiredJwtAuthenticationException extends JwtAuthenticationException {

    public ExpiredJwtAuthenticationException(String message) {
        super(message);
    }

    public ExpiredJwtAuthenticationException(String message, Throwable cause) {
        super(message, cause);
    }
}
