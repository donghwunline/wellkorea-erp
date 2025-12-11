package com.wellkorea.backend.shared.dto;

import com.wellkorea.backend.shared.exception.ErrorCode;

import java.time.LocalDateTime;

/**
 * Standard error response structure for REST API.
 * Used by GlobalExceptionHandler to provide consistent error format across all endpoints.
 * <p>
 * Example JSON response:
 * <pre>
 * {
 *   "timestamp": "2025-12-04T10:30:00",
 *   "status": 404,
 *   "errorCode": "RES_001",
 *   "message": "Project not found with id: 12345",
 *   "path": "/api/projects/12345"
 * }
 * </pre>
 *
 * @param timestamp When the error occurred (ISO-8601 format)
 * @param status    HTTP status code (e.g., 400, 404, 500)
 * @param errorCode Machine-readable error code for debugging (from ErrorCode enum)
 * @param message   Human-readable error message for the client
 * @param path      Request path that caused the error
 */
public record ErrorResponse(
        LocalDateTime timestamp,
        int status,
        String errorCode,
        String message,
        String path
) {
    /**
     * Convenience constructor using ErrorCode enum.
     */
    public static ErrorResponse of(ErrorCode errorCode, String message, String path) {
        return new ErrorResponse(
                LocalDateTime.now(),
                errorCode.getStatus(),
                errorCode.getCode(),
                message,
                path
        );
    }
}
