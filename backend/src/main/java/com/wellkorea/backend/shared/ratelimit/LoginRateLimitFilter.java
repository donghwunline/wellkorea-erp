package com.wellkorea.backend.shared.ratelimit;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wellkorea.backend.shared.dto.ErrorResponse;
import com.wellkorea.backend.shared.exception.ErrorCode;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.jetbrains.annotations.NotNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filter to rate limit login attempts per IP address.
 * Protects against brute force attacks on the authentication endpoint.
 * <p>
 * Configuration:
 * - Applies only to POST /api/auth/login
 * - Allows 5 attempts per minute per IP address
 * - Returns HTTP 429 with ErrorResponse JSON when rate limited
 * <p>
 * IP Address Resolution:
 * - Checks X-Forwarded-For header first (for reverse proxy setups)
 * - Falls back to request.getRemoteAddr()
 */
@Component
public class LoginRateLimitFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(LoginRateLimitFilter.class);
    private static final String LOGIN_PATH = "/api/auth/login";

    private final RateLimiter rateLimiter;
    private final ObjectMapper objectMapper;

    public LoginRateLimitFilter(RateLimiter rateLimiter, ObjectMapper objectMapper) {
        this.rateLimiter = rateLimiter;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(@NotNull HttpServletRequest request, @NotNull HttpServletResponse response,
                                    @NotNull FilterChain filterChain) throws ServletException, IOException {

        // Only rate limit POST requests to /api/auth/login
        if (!isLoginRequest(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientIp = getClientIp(request);

        if (!rateLimiter.tryConsume(clientIp)) {
            long retryAfterSeconds = rateLimiter.getSecondsUntilReset(clientIp);

            logger.warn("Rate limit exceeded for IP: {} on login endpoint. Retry after {} seconds.",
                    clientIp, retryAfterSeconds);

            sendRateLimitResponse(response, request, retryAfterSeconds);
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean isLoginRequest(HttpServletRequest request) {
        return "POST".equalsIgnoreCase(request.getMethod())
                && LOGIN_PATH.equals(request.getRequestURI());
    }

    private String getClientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isEmpty()) {
            // X-Forwarded-For can contain multiple IPs; take the first (original client)
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private void sendRateLimitResponse(HttpServletResponse response, HttpServletRequest request,
                                       long retryAfterSeconds) throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");

        // Add Retry-After header as per HTTP specification
        if (retryAfterSeconds > 0) {
            response.setHeader("Retry-After", String.valueOf(retryAfterSeconds));
        }

        ErrorResponse errorResponse = ErrorResponse.of(
                ErrorCode.RATE_LIMITED,
                "Too many login attempts. Please try again later.",
                request.getRequestURI()
        );

        response.getWriter().write(objectMapper.writeValueAsString(errorResponse));
    }
}
