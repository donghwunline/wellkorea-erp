package com.wellkorea.backend.shared.exception;

/**
 * Exception thrown when attempting to create a resource that already exists (HTTP 409).
 * Used for unique constraint violations in business logic.
 * <p>
 * Examples:
 * - Duplicate project-product combination in work progress
 * - Duplicate JobCode
 * - Duplicate user email/username
 */
public class DuplicateResourceException extends RuntimeException {

    public DuplicateResourceException(String message) {
        super(message);
    }

    public DuplicateResourceException(String message, Throwable cause) {
        super(message, cause);
    }
}
