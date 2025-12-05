package com.wellkorea.backend.shared.dto;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Standard success response wrapper for REST API.
 * Provides consistent structure for all successful API responses with optional metadata.
 * <p>
 * Example JSON response:
 * <pre>
 * {
 *   "success": true,
 *   "message": "Project created successfully",
 *   "data": {
 *     "id": 1,
 *     "jobCode": "WK2025-000001-20250101",
 *     "projectName": "Sample Project"
 *   },
 *   "timestamp": "2025-12-05T10:30:00",
 *   "metadata": {
 *     "page": 0,
 *     "size": 20,
 *     "totalElements": 150,
 *     "totalPages": 8
 *   }
 * }
 * </pre>
 *
 * @param <T>       Type of the response data payload
 * @param success   Always true for successful responses
 * @param message   Human-readable success message
 * @param data      The actual response payload (can be any type: DTO, List, primitive, etc.)
 * @param timestamp When the response was generated (ISO-8601 format)
 * @param metadata  Optional metadata (pagination info, audit trails, custom fields)
 */
public record ApiResponse<T>(
        boolean success,
        String message,
        T data,
        LocalDateTime timestamp,
        Map<String, Object> metadata
) {
    /**
     * Create a success response with data and default "Success" message.
     *
     * @param data Response payload
     * @param <T>  Type of the response data
     * @return ApiResponse with success=true, default message, current timestamp, no metadata
     */
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, "Success", data, LocalDateTime.now(), null);
    }

    /**
     * Create a success response with data and custom message.
     *
     * @param data    Response payload
     * @param message Custom success message
     * @param <T>     Type of the response data
     * @return ApiResponse with success=true, custom message, current timestamp, no metadata
     */
    public static <T> ApiResponse<T> success(T data, String message) {
        return new ApiResponse<>(true, message, data, LocalDateTime.now(), null);
    }

    /**
     * Create a success response with data, custom message, and metadata.
     * Useful for paginated responses or when additional context is needed.
     *
     * @param data     Response payload
     * @param message  Custom success message
     * @param metadata Additional metadata (e.g., pagination info, audit trails)
     * @param <T>      Type of the response data
     * @return ApiResponse with success=true, custom message, current timestamp, metadata
     * @example
     * <pre>
     * // Paginated response example
     * Page&lt;ProjectDTO&gt; page = projectService.findAll(pageable);
     * Map&lt;String, Object&gt; metadata = Map.of(
     *     "page", page.getNumber(),
     *     "size", page.getSize(),
     *     "totalElements", page.getTotalElements(),
     *     "totalPages", page.getTotalPages(),
     *     "first", page.isFirst(),
     *     "last", page.isLast()
     * );
     * return ResponseEntity.ok(ApiResponse.successWithMetadata(
     *     page.getContent(),
     *     "Projects retrieved successfully",
     *     metadata
     * ));
     * </pre>
     */
    public static <T> ApiResponse<T> successWithMetadata(T data, String message, Map<String, Object> metadata) {
        return new ApiResponse<>(true, message, data, LocalDateTime.now(), metadata);
    }

    /**
     * Create a success response with data and metadata, using default "Success" message.
     *
     * @param data     Response payload
     * @param metadata Additional metadata
     * @param <T>      Type of the response data
     * @return ApiResponse with success=true, default message, current timestamp, metadata
     */
    public static <T> ApiResponse<T> successWithMetadata(T data, Map<String, Object> metadata) {
        return new ApiResponse<>(true, "Success", data, LocalDateTime.now(), metadata);
    }
}
