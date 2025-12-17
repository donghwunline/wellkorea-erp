package com.wellkorea.backend.auth.infrastructure.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;

/**
 * JWT authentication filter that intercepts requests and validates JWT tokens.
 * Runs once per request to extract and validate the JWT token from the Authorization header.
 * <p>
 * TEMPORARY: This filter will be replaced with OAuth2 Resource Server filter chain
 * when Keycloak integration is implemented. See docs/keycloak-migration.md.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String PREFIX = "Bearer ";

    private final JwtTokenProvider jwtTokenProvider;
    private final CustomAuthenticationEntryPoint authenticationEntryPoint;

    public JwtAuthenticationFilter(JwtTokenProvider jwtTokenProvider, CustomAuthenticationEntryPoint authenticationEntryPoint) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.authenticationEntryPoint = authenticationEntryPoint;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull FilterChain filterChain) throws ServletException, IOException {

        try {
            // Extract JWT token from Authorization header
            String jwt = getJwtFromRequest(request);

            // If token is present, validate it (throws exception if invalid/expired)
            if (StringUtils.hasText(jwt)) {
                jwtTokenProvider.validateToken(jwt);

                // Token is valid - set authentication in SecurityContext
                String username = jwtTokenProvider.getUsername(jwt);
                String rolesString = jwtTokenProvider.getRoles(jwt);

                // Convert comma-separated roles to GrantedAuthority list
                // Handle null/empty roles gracefully
                Collection<GrantedAuthority> authorities = (rolesString != null && !rolesString.isEmpty())
                        ? Arrays.stream(rolesString.split(","))
                        .filter(StringUtils::hasText)  // Filter out empty strings
                        .map(role -> (GrantedAuthority) new SimpleGrantedAuthority(role))
                        .toList()
                        : Collections.emptyList();

                // Create UserDetails for @AuthenticationPrincipal support
                // This enables OAuth2-compatible principal injection in controllers
                UserDetails userDetails = new User(username, "", authorities);

                // Create authentication token with UserDetails as principal
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(userDetails, null, authorities);
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // Set authentication in SecurityContext
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }

        } catch (JwtAuthenticationException ex) {
            // Handle JWT authentication exceptions via CustomAuthenticationEntryPoint
            authenticationEntryPoint.commence(request, response, ex);
            return; // Stop filter chain execution
        } catch (Exception ex) {
            logger.error("Could not set user authentication in security context", ex);
            InvalidJwtAuthenticationException authException = new InvalidJwtAuthenticationException("Authentication failed", ex);
            authenticationEntryPoint.commence(request, response, authException);
            return; // Stop filter chain execution
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Extract JWT token from Authorization header.
     *
     * @param request HTTP request
     * @return JWT token string, or null if not found
     */
    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith(PREFIX)) {
            return bearerToken.substring(PREFIX.length());
        }
        return null;
    }
}
