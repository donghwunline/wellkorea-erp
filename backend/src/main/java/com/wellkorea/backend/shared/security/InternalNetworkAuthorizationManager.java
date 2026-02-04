package com.wellkorea.backend.shared.security;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.authorization.AuthorizationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.access.intercept.RequestAuthorizationContext;
import org.springframework.stereotype.Component;

import java.util.function.Supplier;
import java.util.regex.Pattern;

/**
 * Authorization manager that restricts access to internal network IPs only.
 * <p>
 * Used to secure sensitive endpoints like /actuator/prometheus that should only
 * be accessible from internal monitoring systems (Prometheus, Grafana, etc.)
 * running within the Docker network or on the same host.
 * <p>
 * Allowed IP ranges:
 * <ul>
 *   <li>Localhost: 127.0.0.1, ::1, 0:0:0:0:0:0:0:1</li>
 *   <li>RFC 1918 Private IPv4: 10.x.x.x, 172.16-31.x.x, 192.168.x.x</li>
 *   <li>Docker default bridge: 172.17.x.x (covered by 172.16-31 range)</li>
 * </ul>
 * <p>
 * Respects X-Forwarded-For and X-Real-IP headers for requests proxied through
 * load balancers or reverse proxies.
 */
@Component
public class InternalNetworkAuthorizationManager implements AuthorizationManager<RequestAuthorizationContext> {

    private static final Logger log = LoggerFactory.getLogger(InternalNetworkAuthorizationManager.class);

    /**
     * Pattern matching RFC 1918 private IPv4 addresses and localhost.
     * <ul>
     *   <li>127.0.0.1 - IPv4 localhost</li>
     *   <li>10.0.0.0 - 10.255.255.255 (10.x.x.x)</li>
     *   <li>172.16.0.0 - 172.31.255.255 (172.16-31.x.x)</li>
     *   <li>192.168.0.0 - 192.168.255.255 (192.168.x.x)</li>
     * </ul>
     */
    private static final Pattern INTERNAL_IPV4_PATTERN = Pattern.compile(
            "^(" +
                    "127\\.0\\.0\\.1|" +                                    // Localhost
                    "10\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}|" +               // 10.x.x.x
                    "172\\.(1[6-9]|2[0-9]|3[0-1])\\.\\d{1,3}\\.\\d{1,3}|" + // 172.16-31.x.x
                    "192\\.168\\.\\d{1,3}\\.\\d{1,3}" +                     // 192.168.x.x
                    ")$"
    );

    /**
     * IPv6 localhost addresses.
     */
    private static final Pattern LOCALHOST_IPV6_PATTERN = Pattern.compile(
            "^(::1|0:0:0:0:0:0:0:1)$"
    );

    private static final String X_FORWARDED_FOR = "X-Forwarded-For";
    private static final String X_REAL_IP = "X-Real-IP";

    @Override
    public AuthorizationDecision check(Supplier<Authentication> authentication,
                                       RequestAuthorizationContext context) {
        HttpServletRequest request = context.getRequest();
        String clientIp = extractClientIp(request);
        boolean isInternal = isInternalIp(clientIp);

        if (!isInternal) {
            log.warn("Access denied to {} from external IP: {}",
                    request.getRequestURI(), clientIp);
        } else {
            log.debug("Access granted to {} from internal IP: {}",
                    request.getRequestURI(), clientIp);
        }

        return new AuthorizationDecision(isInternal);
    }

    /**
     * Extracts the client IP address from the request.
     * <p>
     * Checks headers in order of precedence:
     * <ol>
     *   <li>X-Forwarded-For (first IP in comma-separated list)</li>
     *   <li>X-Real-IP</li>
     *   <li>HttpServletRequest.getRemoteAddr()</li>
     * </ol>
     *
     * @param request the HTTP request
     * @return the client IP address, or null if not determinable
     */
    String extractClientIp(HttpServletRequest request) {
        // Check X-Forwarded-For first (may contain multiple IPs)
        String xForwardedFor = request.getHeader(X_FORWARDED_FOR);
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            // Take the first IP (original client) from comma-separated list
            String[] ips = xForwardedFor.split(",");
            if (ips.length > 0) {
                String firstIp = ips[0].trim();
                if (!firstIp.isEmpty()) {
                    return firstIp;
                }
            }
        }

        // Check X-Real-IP (single IP)
        String xRealIp = request.getHeader(X_REAL_IP);
        if (xRealIp != null && !xRealIp.isBlank()) {
            return xRealIp.trim();
        }

        // Fall back to remote address
        return request.getRemoteAddr();
    }

    /**
     * Checks if the given IP address is from an internal network.
     *
     * @param ip the IP address to check
     * @return true if the IP is internal (localhost or RFC 1918 private), false otherwise
     */
    boolean isInternalIp(String ip) {
        if (ip == null || ip.isBlank()) {
            return false;
        }

        String trimmedIp = ip.trim();

        // Check IPv4 patterns
        if (INTERNAL_IPV4_PATTERN.matcher(trimmedIp).matches()) {
            return true;
        }

        // Check IPv6 localhost
        return LOCALHOST_IPV6_PATTERN.matcher(trimmedIp).matches();
    }
}
