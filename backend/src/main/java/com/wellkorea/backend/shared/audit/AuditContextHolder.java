package com.wellkorea.backend.shared.audit;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Utility to extract audit context (IP address, user agent) from current HTTP request.
 * Thread-safe using Spring's RequestContextHolder.
 */
@Component
public class AuditContextHolder {

    private static final String UNKNOWN = "unknown";

    private AuditContextHolder() {
    }

    /**
     * Get the client IP address from the current HTTP request.
     * Handles proxies and load balancers by checking X-Forwarded-For header.
     *
     * @return Client IP address, or "unknown" if not available
     */
    public static String getClientIp() {
        HttpServletRequest request = getCurrentRequest();
        if (request == null) {
            return UNKNOWN;
        }

        // Check X-Forwarded-For header (proxy/load balancer)
        String ip = request.getHeader("X-Forwarded-For");
        if (ip != null && !ip.isEmpty() && !UNKNOWN.equalsIgnoreCase(ip)) {
            // X-Forwarded-For can contain multiple IPs - take the first one
            int index = ip.indexOf(',');
            return index != -1 ? ip.substring(0, index).trim() : ip.trim();
        }

        // Check X-Real-IP header (nginx proxy)
        ip = request.getHeader("X-Real-IP");
        if (ip != null && !ip.isEmpty() && !UNKNOWN.equalsIgnoreCase(ip)) {
            return ip.trim();
        }

        // Fallback to remote address
        ip = request.getRemoteAddr();
        return ip != null ? ip : UNKNOWN;
    }

    /**
     * Get the user agent string from the current HTTP request.
     *
     * @return User agent string, or "unknown" if not available
     */
    public static String getUserAgent() {
        HttpServletRequest request = getCurrentRequest();
        if (request == null) {
            return UNKNOWN;
        }

        String userAgent = request.getHeader("User-Agent");
        return userAgent != null ? userAgent : UNKNOWN;
    }

    /**
     * Get the request URI from the current HTTP request.
     *
     * @return Request URI, or "unknown" if not available
     */
    public static String getRequestUri() {
        HttpServletRequest request = getCurrentRequest();
        if (request == null) {
            return UNKNOWN;
        }

        return request.getRequestURI();
    }

    /**
     * Get the current HTTP request from RequestContextHolder.
     *
     * @return Current HttpServletRequest, or null if not in request context
     */
    private static HttpServletRequest getCurrentRequest() {
        ServletRequestAttributes attributes =
                (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        return attributes != null ? attributes.getRequest() : null;
    }
}
