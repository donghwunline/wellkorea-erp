package com.wellkorea.backend.shared.exception;

/**
 * Exception thrown when PDF generation fails (HTTP 500).
 * Used for IO errors, template processing failures, and other PDF-related errors.
 */
public class PdfGenerationException extends RuntimeException {

    public PdfGenerationException(String message) {
        super(message);
    }

    public PdfGenerationException(String message, Throwable cause) {
        super(message, cause);
    }
}
