package com.wellkorea.backend.auth.infrastructure.config;

import com.wellkorea.backend.auth.application.TokenBlacklistService;
import com.wellkorea.backend.auth.domain.AuthenticatedUser;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.Collection;

/**
 * JWT authentication filter that intercepts requests and validates JWT tokens.
 * Runs once per request to extract and validate the JWT token from the Authorization header.
 *
 * <p>This filter performs:
 * <ol>
 *     <li>Token extraction from Authorization header</li>
 *     <li>Token signature and expiration validation</li>
 *     <li>Blacklist check (reject logged-out tokens)</li>
 *     <li>Claims extraction (username, userId, roles)</li>
 *     <li>SecurityContext population with {@link AuthenticatedUser} principal</li>
 * </ol>
 *
 * <p>TEMPORARY: This filter will be replaced with OAuth2 Resource Server filter chain
 * when Keycloak integration is implemented. See docs/keycloak-migration.md.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String HEADER_NAME = "Authorization";
    private static final String PREFIX = "Bearer ";

    private final JwtTokenProvider jwtTokenProvider;
    private final TokenBlacklistService tokenBlacklistService;
    private final AuthenticationEntryPoint authenticationEntryPoint;

    public JwtAuthenticationFilter(JwtTokenProvider jwtTokenProvider, TokenBlacklistService tokenBlacklistService, CustomAuthenticationEntryPoint authenticationEntryPoint) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.tokenBlacklistService = tokenBlacklistService;
        this.authenticationEntryPoint = authenticationEntryPoint;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull FilterChain filterChain) throws ServletException, IOException {

        try {
            // Extract JWT token from Authorization header
            String jwt = getJwtFromRequest(request);

            // If token is present, validate it (throws exception if invalid/expired)
            if (StringUtils.hasText(jwt)) {
                // Step 1: Validate token signature and expiration
                jwtTokenProvider.validateToken(jwt);

                // Step 2: Check if token is blacklisted (logged out)
                if (tokenBlacklistService.isBlacklisted(jwt)) {
                    throw new InvalidJwtAuthenticationException("Token has been invalidated");
                }

                // Step 3: Extract claims from validated token
                Long userId = jwtTokenProvider.getUserId(jwt);
                String username = jwtTokenProvider.getUsername(jwt);
                String[] roles = jwtTokenProvider.getRoles(jwt);

                // Step 4: Validate userId is present (required for authenticated operations)
                if (userId == null || username == null) {
                    throw new InvalidJwtAuthenticationException("Token missing userId claim, please re-login");
                }

                // Convert roles array to GrantedAuthority list
                Collection<GrantedAuthority> authorities = Arrays.stream(roles)
                        .filter(StringUtils::hasText)
                        .map(role -> (GrantedAuthority) new SimpleGrantedAuthority(role))
                        .toList();

                // Step 5: Create AuthenticatedUser for @AuthenticationPrincipal support
                // This enables direct userId access in controllers without token parsing
                AuthenticatedUser authenticatedUser = new AuthenticatedUser(userId, username, authorities);

                // Create authentication token with AuthenticatedUser as principal
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(authenticatedUser, null, authorities);
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
        String bearerToken = request.getHeader(HEADER_NAME);
        if (bearerToken != null && bearerToken.startsWith(PREFIX)) {
            return bearerToken.substring(PREFIX.length());
        }
        return null;
    }
}
