package com.wellkorea.backend.shared.exception;

/**
 * Enum defining all application error codes for consistent error handling.
 * Each error code is associated with an HTTP status code and category.
 * <p>
 * Usage in exception handlers:
 * <pre>
 * ErrorResponse response = new ErrorResponse(
 *     LocalDateTime.now(),
 *     ErrorCode.RESOURCE_NOT_FOUND.getStatus(),
 *     ErrorCode.RESOURCE_NOT_FOUND.getCode(),
 *     "Project not found with id: 123",
 *     "/api/projects/123"
 * );
 * </pre>
 */
public enum ErrorCode {

    // ========== Validation Errors (400) ==========
    VALIDATION_FAILED(400, "VAL_001", "Request validation failed"),
    CONSTRAINT_VIOLATION(400, "VAL_002", "Constraint violation"),
    INVALID_ARGUMENT(400, "VAL_003", "Invalid argument provided"),

    // ========== Business Logic Errors (400-409) ==========
    BUSINESS_RULE_VIOLATION(400, "BUS_001", "Business rule violation"),
    ILLEGAL_STATE(409, "BUS_002", "Illegal state - operation cannot be performed"),
    DUPLICATE_RESOURCE(409, "BUS_003", "Resource already exists"),
    CONCURRENT_MODIFICATION(409, "BUS_004", "Concurrent modification detected - please retry"),

    // ========== Finance Domain Errors ==========
    PAYMENT_NOT_ALLOWED(409, "FIN_001", "Payment not allowed in current AP status"),
    PAYMENT_EXCEEDS_BALANCE(400, "FIN_002", "Payment amount exceeds remaining balance"),

    // ========== OAuth2 Errors ==========
    OAUTH_INVALID_STATE(400, "OAUTH_001", "Invalid or expired OAuth2 state"),
    OAUTH_STATE_EXPIRED(400, "OAUTH_002", "OAuth2 state has expired"),
    OAUTH_TOKEN_EXCHANGE_FAILED(400, "OAUTH_003", "Failed to exchange authorization code"),
    OAUTH_NO_REFRESH_TOKEN(400, "OAUTH_004", "No refresh token received"),
    OAUTH_CONFIG_MISSING(400, "OAUTH_005", "OAuth2 provider not configured"),
    OAUTH_TOKEN_REFRESH_FAILED(500, "OAUTH_006", "Failed to refresh access token"),
    OAUTH_INVALID_CODE(400, "OAUTH_007", "Invalid authorization code"),
    OAUTH_DATABASE_ERROR(500, "OAUTH_008", "Database error during OAuth operation"),

    // ========== Authentication Errors (401) ==========
    AUTHENTICATION_FAILED(401, "AUTH_001", "Authentication failed"),
    INVALID_TOKEN(401, "AUTH_002", "Invalid or expired token"),
    CREDENTIALS_EXPIRED(401, "AUTH_003", "Credentials have expired"),

    // ========== Authorization Errors (403) ==========
    ACCESS_DENIED(403, "AUTHZ_001", "Access denied - insufficient permissions"),
    FORBIDDEN_OPERATION(403, "AUTHZ_002", "Operation forbidden for this user"),

    // ========== Rate Limiting Errors (429) ==========
    RATE_LIMITED(429, "RATE_001", "Too many requests - please try again later"),

    // ========== Resource Errors (404) ==========
    RESOURCE_NOT_FOUND(404, "RES_001", "Requested resource not found"),
    ENDPOINT_NOT_FOUND(404, "RES_002", "API endpoint not found"),

    // ========== Server Errors (500+) ==========
    INTERNAL_SERVER_ERROR(500, "SRV_001", "Internal server error"),
    DATABASE_ERROR(500, "SRV_002", "Database operation failed"),
    EXTERNAL_SERVICE_ERROR(502, "SRV_003", "External service unavailable"),
    SERVICE_UNAVAILABLE(503, "SRV_004", "Service temporarily unavailable");

    private final int status;
    private final String code;
    private final String description;

    ErrorCode(int status, String code, String description) {
        this.status = status;
        this.code = code;
        this.description = description;
    }

    /**
     * Get the HTTP status code associated with this error.
     *
     * @return HTTP status code (e.g., 400, 404, 500)
     */
    public int getStatus() {
        return status;
    }

    /**
     * Get the machine-readable error code.
     *
     * @return Error code string (e.g., "VAL_001", "RES_001")
     */
    public String getCode() {
        return code;
    }

    /**
     * Get the human-readable description of this error type.
     *
     * @return Error description
     */
    public String getDescription() {
        return description;
    }

    @Override
    public String toString() {
        return String.format("%s [%d]: %s", code, status, description);
    }
}
