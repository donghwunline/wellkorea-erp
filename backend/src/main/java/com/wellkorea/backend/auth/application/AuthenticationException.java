package com.wellkorea.backend.auth.application;

/**
 * Exception thrown when authentication fails.
 * Used for invalid credentials, expired tokens, inactive users, etc.
 */
public class AuthenticationException extends RuntimeException {

    public AuthenticationException(String message) {
        super(message);
    }

    public AuthenticationException(String message, Throwable cause) {
        super(message, cause);
    }
}
