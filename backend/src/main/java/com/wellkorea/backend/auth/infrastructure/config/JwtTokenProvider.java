package com.wellkorea.backend.auth.infrastructure.config;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SecurityException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * JWT token provider for generating and validating JWT tokens.
 * Handles token generation, validation, and claims extraction.
 * Thread-safe and stateless.
 * <p>
 * TEMPORARY: This class will be replaced with OAuth2 Resource Server configuration
 * when Keycloak integration is implemented. See docs/keycloak-migration.md.
 */
@Component
public class JwtTokenProvider {

    private static final Logger log = LoggerFactory.getLogger(JwtTokenProvider.class);

    private final SecretKey secretKey;
    private final long validityInMilliseconds;

    public JwtTokenProvider(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expiration}") long validityInMilliseconds) {

        // Ensure secret is at least 256 bits (32 bytes) for HS256
        if (secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalArgumentException("JWT secret must be at least 256 bits (32 bytes)");
        }

        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.validityInMilliseconds = validityInMilliseconds;
    }

    /**
     * Generate JWT token from username, roles, and user ID.
     *
     * @param username Username
     * @param roles    Comma-separated roles (e.g., "ROLE_ADMIN,ROLE_FINANCE")
     * @param userId   User ID (required for production use, can be null for testing)
     * @return JWT token string
     */
    public String generateToken(String username, String roles, Long userId) {
        Date now = new Date();
        Date validity = new Date(now.getTime() + validityInMilliseconds);

        var builder = Jwts.builder()
                .subject(username)
                .claim("roles", roles)
                .issuedAt(now)
                .expiration(validity);

        if (userId != null) {
            builder.claim("userId", userId);
        }

        return builder.signWith(secretKey, Jwts.SIG.HS256).compact();
    }

    /**
     * Extract username from JWT token.
     *
     * @param token JWT token
     * @return Username (subject)
     */
    public String getUsername(String token) {
        return getClaims(token).getSubject();
    }

    /**
     * Extract roles from JWT token.
     *
     * @param token JWT token
     * @return Array of role strings (e.g., ["ROLE_ADMIN", "ROLE_FINANCE"])
     */
    public String[] getRoles(String token) {
        String rolesString = getClaims(token).get("roles", String.class);
        if (rolesString == null || rolesString.isEmpty()) {
            return new String[0];
        }
        return rolesString.split(",");
    }

    /**
     * Extract user ID from JWT token.
     *
     * @param token JWT token
     * @return User ID, or null if not present in token
     */
    public Long getUserId(String token) {
        return getClaims(token).get("userId", Long.class);
    }

    /**
     * Extract claims from JWT token.
     * Private helper method to avoid duplicating parser chain.
     *
     * @param token JWT token
     * @return Claims payload
     */
    private io.jsonwebtoken.Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * Validate JWT token.
     * Throws specific authentication exceptions for expired vs invalid tokens.
     *
     * @param token JWT token
     * @throws ExpiredJwtAuthenticationException if token is expired (AUTH_003)
     * @throws InvalidJwtAuthenticationException if token is invalid (AUTH_002)
     */
    public void validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(secretKey)
                    .build()
                    .parseSignedClaims(token);
            log.debug("Token validation successful");

        } catch (ExpiredJwtException e) {
            log.debug("Expired JWT token: {}", e.getMessage());
            throw new ExpiredJwtAuthenticationException("Token has expired", e);

        } catch (SecurityException | MalformedJwtException | UnsupportedJwtException | IllegalArgumentException e) {
            log.debug("Invalid JWT token: {}", e.getMessage());
            throw new InvalidJwtAuthenticationException("Invalid token", e);

        } catch (Exception e) {
            log.error("Unexpected error during token validation", e);
            throw new InvalidJwtAuthenticationException("Token validation failed", e);
        }
    }
}
