package com.wellkorea.backend.auth.infrastructure.config;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SecurityException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.stream.Collectors;

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
     * Generate JWT token from Authentication object.
     *
     * @param authentication Spring Security Authentication
     * @return JWT token string
     */
    public String generateToken(Authentication authentication) {
        String username = authentication.getName();
        String roles = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.joining(","));

        return generateToken(username, roles);
    }

    /**
     * Generate JWT token from username and roles.
     *
     * @param username Username
     * @param roles    Comma-separated roles (e.g., "ROLE_ADMIN,ROLE_FINANCE")
     * @return JWT token string
     */
    public String generateToken(String username, String roles) {
        Date now = new Date();
        Date validity = new Date(now.getTime() + validityInMilliseconds);

        return Jwts.builder()
                .subject(username)
                .claim("roles", roles)
                .issuedAt(now)
                .expiration(validity)
                .signWith(secretKey, Jwts.SIG.HS256)
                .compact();
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
     * @return Comma-separated roles string
     */
    public String getRoles(String token) {
        return getClaims(token).get("roles", String.class);
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
     *
     * @param token JWT token
     * @return true if valid, false otherwise
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(secretKey)
                    .build()
                    .parseSignedClaims(token);
            return true;

        } catch (SecurityException | MalformedJwtException e) {
            log.debug("Invalid JWT signature: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            log.debug("Expired JWT token: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            log.debug("Unsupported JWT token: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            log.debug("JWT claims string is empty: {}", e.getMessage());
        }

        return false;
    }

    /**
     * Extract token from Authorization header.
     *
     * @param authorizationHeader Authorization header value
     * @return JWT token string, or null if not found
     */
    public String extractTokenFromHeader(String authorizationHeader) {
        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            return authorizationHeader.substring(7);
        }
        return null;
    }
}
