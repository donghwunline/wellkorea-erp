package com.wellkorea.backend.shared.exception;

/**
 * Exception thrown when a business rule is violated (HTTP 400).
 * Used for domain logic validation failures that are not simple input validation.
 * <p>
 * Examples:
 * - Cannot delete a project with active quotations
 * - Cannot approve a quotation without products
 * - Cannot create invoice for undelivered products
 * - Duplicate JobCode generation attempt
 */
public class BusinessException extends RuntimeException {

    public BusinessException(String message) {
        super(message);
    }

    public BusinessException(String message, Throwable cause) {
        super(message, cause);
    }
}
