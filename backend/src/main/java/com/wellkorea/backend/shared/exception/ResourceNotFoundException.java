package com.wellkorea.backend.shared.exception;

/**
 * Exception thrown when a requested resource is not found (HTTP 404).
 * Used for entity lookup failures (e.g., Project not found, Customer not found).
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }

    public ResourceNotFoundException(String resourceType, Object id) {
        super(String.format("%s not found with id: %s", resourceType, id));
    }

    public ResourceNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}
