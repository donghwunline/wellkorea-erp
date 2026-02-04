package com.wellkorea.backend.shared.security;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.authorization.AuthorizationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.access.intercept.RequestAuthorizationContext;
import org.springframework.stereotype.Component;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.function.Supplier;

/**
 * Authorization manager that restricts access to internal network IPs only.
 * <p>
 * Used to secure sensitive endpoints like /actuator/prometheus that should only
 * be accessible from internal monitoring systems (Prometheus, Grafana, etc.)
 * running within the Docker network or on the same host.
 * <p>
 * Allowed IP ranges (determined by {@link InetAddress#isLoopbackAddress()} and
 * {@link InetAddress#isSiteLocalAddress()}):
 * <ul>
 *   <li>Loopback: 127.x.x.x (IPv4), ::1 (IPv6)</li>
 *   <li>Site-local IPv4: 10.x.x.x, 172.16-31.x.x, 192.168.x.x</li>
 *   <li>Site-local IPv6: fe80::/10 (link-local), fec0::/10 (deprecated site-local)</li>
 *   <li>Docker default bridge: 172.17.x.x (covered by site-local range)</li>
 * </ul>
 * <p>
 * <b>Security:</b> X-Forwarded-For and X-Real-IP headers are only trusted when the
 * direct connection (remoteAddr) comes from an internal IP. This prevents header
 * spoofing attacks from external sources.
 */
@Component
public class InternalNetworkAuthorizationManager implements AuthorizationManager<RequestAuthorizationContext> {

    private static final Logger log = LoggerFactory.getLogger(InternalNetworkAuthorizationManager.class);

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
     * <b>Security:</b> Proxy headers (X-Forwarded-For, X-Real-IP) are only trusted
     * when the direct connection comes from an internal IP address. This prevents
     * attackers from spoofing these headers to bypass IP restrictions.
     * <p>
     * When trusted, checks headers in order of precedence:
     * <ol>
     *   <li>X-Forwarded-For (first IP in comma-separated list)</li>
     *   <li>X-Real-IP</li>
     *   <li>HttpServletRequest.getRemoteAddr()</li>
     * </ol>
     *
     * @param request the HTTP request
     * @return the client IP address
     */
    String extractClientIp(HttpServletRequest request) {
        String remoteAddr = request.getRemoteAddr();

        // Only trust proxy headers from internal sources to prevent spoofing
        if (!isInternalIp(remoteAddr)) {
            return remoteAddr;
        }

        // Trust headers from internal proxy
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
        return remoteAddr;
    }

    /**
     * Checks if the given IP address is from an internal network.
     * <p>
     * Uses {@link InetAddress} for proper IP validation:
     * <ul>
     *   <li>{@link InetAddress#isLoopbackAddress()} - 127.x.x.x, ::1</li>
     *   <li>{@link InetAddress#isSiteLocalAddress()} - RFC 1918 private ranges</li>
     * </ul>
     *
     * @param ip the IP address to check
     * @return true if the IP is internal (loopback or site-local), false otherwise
     */
    boolean isInternalIp(String ip) {
        if (ip == null || ip.isBlank()) {
            return false;
        }

        try {
            InetAddress addr = InetAddress.getByName(ip.trim());
            return addr.isLoopbackAddress() || addr.isSiteLocalAddress();
        } catch (UnknownHostException e) {
            // Invalid IP format
            return false;
        }
    }
}
