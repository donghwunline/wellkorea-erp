package com.wellkorea.backend.shared.exception;

import com.wellkorea.backend.auth.application.AuthenticationException;
import com.wellkorea.backend.shared.audit.AuditContextHolder;
import com.wellkorea.backend.shared.audit.AuditLogger;
import com.wellkorea.backend.shared.dto.ErrorResponse;
import jakarta.validation.ConstraintViolationException;
import org.jetbrains.annotations.NotNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import java.util.List;
import java.util.Map;

/**
 * Global exception handler for REST API error responses.
 * Extends ResponseEntityExceptionHandler to leverage Spring's built-in exception handling
 * while providing custom ErrorResponse structure and audit logging.
 * <p>
 * Handles:
 * - Spring MVC validation exceptions (via inherited methods)
 * - Custom business exceptions (ResourceNotFoundException, BusinessException)
 * - Security exceptions with audit logging (AccessDeniedException, BadCredentialsException)
 * - Generic runtime exceptions
 */
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    private final AuditLogger auditLogger;

    public GlobalExceptionHandler(AuditLogger auditLogger) {
        this.auditLogger = auditLogger;
    }

    /**
     * Override to handle validation errors from @Valid annotations.
     * Wraps Spring's default handling in our ErrorResponse structure.
     */
    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex,
            @NotNull HttpHeaders headers,
            @NotNull HttpStatusCode status,
            WebRequest request) {

        List<String> errors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .toList();

        String message = errors.isEmpty() ? "Invalid request parameters" : String.join(", ", errors);
        ErrorResponse errorResponse = ErrorResponse.of(
                ErrorCode.VALIDATION_FAILED,
                message,
                request.getDescription(false).replace("uri=", "")
        );

        log.warn("Validation error: {}", errors);
        return ResponseEntity.badRequest().body(errorResponse);
    }

    /**
     * Handle constraint violations from method-level validation (@Validated).
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponse> handleConstraintViolation(
            ConstraintViolationException ex,
            WebRequest request) {

        List<String> errors = ex.getConstraintViolations()
                .stream()
                .map(violation -> violation.getPropertyPath() + ": " + violation.getMessage())
                .toList();

        String message = errors.isEmpty() ? "Invalid parameters" : String.join(", ", errors);
        ErrorResponse errorResponse = ErrorResponse.of(
                ErrorCode.CONSTRAINT_VIOLATION,
                message,
                request.getDescription(false).replace("uri=", "")
        );

        log.warn("Constraint violation: {}", errors);
        return ResponseEntity.badRequest().body(errorResponse);
    }

    /**
     * Handle resource not found exceptions (404).
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFound(
            ResourceNotFoundException ex,
            WebRequest request) {

        ErrorResponse errorResponse = ErrorResponse.of(
                ErrorCode.RESOURCE_NOT_FOUND,
                ex.getMessage(),
                request.getDescription(false).replace("uri=", "")
        );

        log.debug("Resource not found: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
    }

    /**
     * Handle business logic exceptions (400).
     */
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusinessException(
            BusinessException ex,
            WebRequest request) {

        ErrorResponse errorResponse = ErrorResponse.of(
                ErrorCode.BUSINESS_RULE_VIOLATION,
                ex.getMessage(),
                request.getDescription(false).replace("uri=", "")
        );

        log.warn("Business exception: {}", ex.getMessage());
        return ResponseEntity.badRequest().body(errorResponse);
    }

    /**
     * Handle duplicate resource exceptions (409).
     */
    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ErrorResponse> handleDuplicateResource(
            DuplicateResourceException ex,
            WebRequest request) {

        ErrorResponse errorResponse = ErrorResponse.of(
                ErrorCode.DUPLICATE_RESOURCE,
                ex.getMessage(),
                request.getDescription(false).replace("uri=", "")
        );

        log.warn("Duplicate resource: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(errorResponse);
    }

    /**
     * Handle authentication failures (401).
     * Logs failed authentication attempts to audit trail.
     */
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentials(
            BadCredentialsException ex,
            WebRequest request) {

        ErrorResponse errorResponse = ErrorResponse.of(
                ErrorCode.AUTHENTICATION_FAILED,
                "Invalid username or password",
                request.getDescription(false).replace("uri=", "")
        );

        // Log failed authentication attempt
        String ipAddress = AuditContextHolder.getClientIp();
        String userAgent = AuditContextHolder.getUserAgent();
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth != null ? auth.getName() : "anonymous";

        auditLogger.logAccessDenied("User", null, null, username, ipAddress, userAgent,
                Map.of("reason", "Invalid credentials", "path", request.getDescription(false)));

        log.warn("Authentication failed: {} from {} (IP: {})", ex.getMessage(), request.getDescription(false), ipAddress);
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
    }

    /**
     * Handle custom authentication failures (401).
     * Logs failed authentication attempts to audit trail.
     */
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErrorResponse> handleAuthenticationException(
            AuthenticationException ex,
            WebRequest request) {

        ErrorResponse errorResponse = ErrorResponse.of(
                ErrorCode.AUTHENTICATION_FAILED,
                "Authentication failed",
                request.getDescription(false).replace("uri=", "")
        );

        // Log failed authentication attempt
        String ipAddress = AuditContextHolder.getClientIp();
        String userAgent = AuditContextHolder.getUserAgent();
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth != null ? auth.getName() : "anonymous";

        auditLogger.logAccessDenied("User", null, null, username, ipAddress, userAgent,
                Map.of("reason", ex.getMessage(), "path", request.getDescription(false)));

        log.warn("Authentication failed: {} from {} (IP: {})", ex.getMessage(), request.getDescription(false), ipAddress);
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
    }

    /**
     * Handle authorization failures (403).
     * Logs access denied events to audit trail for security monitoring.
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(
            AccessDeniedException ex,
            WebRequest request) {

        ErrorResponse errorResponse = ErrorResponse.of(
                ErrorCode.ACCESS_DENIED,
                "You do not have permission to access this resource",
                request.getDescription(false).replace("uri=", "")
        );

        // Log access denied event
        String ipAddress = AuditContextHolder.getClientIp();
        String userAgent = AuditContextHolder.getUserAgent();
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth != null ? auth.getName() : "anonymous";
        Long userId = null; // Will be populated when User entity is available

        auditLogger.logAccessDenied("Resource", null, userId, username, ipAddress, userAgent,
                Map.of("reason", ex.getMessage(), "path", request.getDescription(false)));

        log.warn("Access denied: {} for {} (user: {}, IP: {})", ex.getMessage(), request.getDescription(false), username, ipAddress);
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
    }

    /**
     * Handle illegal argument exceptions (400).
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(
            IllegalArgumentException ex,
            WebRequest request) {

        ErrorResponse errorResponse = ErrorResponse.of(
                ErrorCode.INVALID_ARGUMENT,
                ex.getMessage(),
                request.getDescription(false).replace("uri=", "")
        );

        log.warn("Illegal argument: {}", ex.getMessage());
        return ResponseEntity.badRequest().body(errorResponse);
    }

    /**
     * Handle illegal state exceptions (409 Conflict).
     */
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorResponse> handleIllegalState(
            IllegalStateException ex,
            WebRequest request) {

        ErrorResponse errorResponse = ErrorResponse.of(
                ErrorCode.ILLEGAL_STATE,
                ex.getMessage(),
                request.getDescription(false).replace("uri=", "")
        );

        log.warn("Illegal state: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(errorResponse);
    }

    /**
     * Catch-all handler for unexpected exceptions (500).
     * Logs full stack trace for debugging while returning safe error message to client.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(
            Exception ex,
            WebRequest request) {

        ErrorResponse errorResponse = ErrorResponse.of(
                ErrorCode.INTERNAL_SERVER_ERROR,
                "An unexpected error occurred. Please contact support if the problem persists.",
                request.getDescription(false).replace("uri=", "")
        );

        log.error("Unexpected error: {} at {}", ex.getMessage(), request.getDescription(false), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
    }
}
