package com.wellkorea.backend.auth.infrastructure.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wellkorea.backend.shared.dto.ErrorResponse;
import com.wellkorea.backend.shared.exception.ErrorCode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Custom authentication entry point for JWT authentication failures.
 * Provides differentiated error codes for expired vs invalid tokens.
 * <p>
 * Error Code Mapping:
 * - EXPIRED token → AUTH_003 "Credentials have expired"
 * - INVALID token → AUTH_002 "Invalid token"
 * - No token/other → AUTH_001 "Authentication failed"
 * <p>
 * TEMPORARY: This class will be replaced with OAuth2 authentication when
 * Keycloak integration is implemented. See docs/keycloak-migration.md.
 */
@Component
public class CustomAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private static final Logger log = LoggerFactory.getLogger(CustomAuthenticationEntryPoint.class);

    private final ObjectMapper objectMapper;

    public CustomAuthenticationEntryPoint(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException authException) throws IOException {

        // Determine error code based on exception type
        ErrorCode errorCode = determineErrorCode(authException);
        String message = determineMessage(errorCode);

        // Log authentication failure (strategic logging - errors only)
        log.warn("Authentication failed for path: {} - Error: {}", request.getRequestURI(), errorCode.getCode());

        // Build error response
        ErrorResponse errorResponse = ErrorResponse.of(errorCode, message, request.getRequestURI());

        // Write JSON response
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(objectMapper.writeValueAsString(errorResponse));
    }

    private ErrorCode determineErrorCode(AuthenticationException authException) {
        // Check exception type for error code mapping
        if (authException instanceof ExpiredJwtAuthenticationException) {
            return ErrorCode.CREDENTIALS_EXPIRED;  // AUTH_003
        }
        if (authException instanceof InvalidJwtAuthenticationException) {
            return ErrorCode.INVALID_TOKEN;  // AUTH_002
        }

        // Default to generic authentication failure for other Spring Security exceptions
        return ErrorCode.AUTHENTICATION_FAILED;  // AUTH_001
    }

    private String determineMessage(ErrorCode errorCode) {
        return switch (errorCode) {
            case CREDENTIALS_EXPIRED -> "Token has expired - please refresh your session";
            case INVALID_TOKEN -> "Invalid token - authentication required";
            default -> "Authentication required";
        };
    }
}
