package com.wellkorea.backend.shared.exception;

import org.springframework.security.core.AuthenticationException;

/**
 * Base authentication exception for JWT validation failures.
 * Subclasses (ExpiredJwtAuthenticationException, InvalidJwtAuthenticationException)
 * allow CustomAuthenticationEntryPoint to differentiate between error types.
 * <p>
 * TEMPORARY: This class will be replaced with OAuth2 authentication when
 * Keycloak integration is implemented. See docs/keycloak-migration.md.
 */
public abstract class JwtAuthenticationException extends AuthenticationException {

    protected JwtAuthenticationException(String message) {
        super(message);
    }

    protected JwtAuthenticationException(String message, Throwable cause) {
        super(message, cause);
    }
}
