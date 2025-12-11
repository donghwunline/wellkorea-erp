package com.wellkorea.backend.auth.infrastructure.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for JwtAuthenticationFilter.
 * Tests JWT token extraction, validation, and SecurityContext population.
 */
@Tag("unit")
@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain filterChain;

    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @BeforeEach
    void setUp() {
        jwtAuthenticationFilter = new JwtAuthenticationFilter(jwtTokenProvider);
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    // ========== Successful Authentication Tests ==========

    @Test
    void shouldAuthenticateWithValidToken() throws Exception {
        // Given: Valid JWT token in Authorization header
        String token = "valid.jwt.token";
        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);
        when(jwtTokenProvider.validateToken(token)).thenReturn(true);
        when(jwtTokenProvider.getUsername(token)).thenReturn("testuser");
        when(jwtTokenProvider.getRoles(token)).thenReturn("ROLE_ADMIN,ROLE_FINANCE");

        // When: Filter processes request
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // Then: SecurityContext populated with authentication
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        assertThat(authentication).isNotNull();
        assertThat(authentication.getName()).isEqualTo("testuser");
        assertThat(authentication.getAuthorities())
                .hasSize(2)
                .extracting("authority")
                .containsExactlyInAnyOrder("ROLE_ADMIN", "ROLE_FINANCE");
        assertThat(authentication.isAuthenticated()).isTrue();

        // Filter chain continues
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void shouldAuthenticateWithSingleRole() throws Exception {
        // Given: Token with single role
        String token = "valid.jwt.token";
        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);
        when(jwtTokenProvider.validateToken(token)).thenReturn(true);
        when(jwtTokenProvider.getUsername(token)).thenReturn("sales");
        when(jwtTokenProvider.getRoles(token)).thenReturn("ROLE_SALES");

        // When: Filter processes request
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // Then: Authentication has single authority
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        assertThat(authentication).isNotNull();
        assertThat(authentication.getAuthorities())
                .hasSize(1)
                .extracting("authority")
                .containsExactly("ROLE_SALES");

        verify(filterChain).doFilter(request, response);
    }

    // ========== Invalid Token Tests ==========

    @Test
    void shouldNotAuthenticateWithInvalidToken() throws Exception {
        // Given: Invalid JWT token
        String token = "invalid.jwt.token";
        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);
        when(jwtTokenProvider.validateToken(token)).thenReturn(false);

        // When: Filter processes request
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // Then: SecurityContext remains empty
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        assertThat(authentication).isNull();

        // Token provider methods not called (validation failed)
        verify(jwtTokenProvider, never()).getUsername(any());
        verify(jwtTokenProvider, never()).getRoles(any());

        // Filter chain continues (no exception thrown)
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void shouldNotAuthenticateWithExpiredToken() throws Exception {
        // Given: Expired token (validation returns false)
        String token = "expired.jwt.token";
        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);
        when(jwtTokenProvider.validateToken(token)).thenReturn(false);

        // When: Filter processes request
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // Then: SecurityContext remains empty
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        assertThat(authentication).isNull();

        verify(filterChain).doFilter(request, response);
    }

    // ========== Missing/Malformed Authorization Header Tests ==========

    @Test
    void shouldNotAuthenticateWithMissingAuthorizationHeader() throws Exception {
        // Given: No Authorization header
        when(request.getHeader("Authorization")).thenReturn(null);

        // When: Filter processes request
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // Then: SecurityContext remains empty
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        assertThat(authentication).isNull();

        // Token provider never called
        verify(jwtTokenProvider, never()).validateToken(any());

        verify(filterChain).doFilter(request, response);
    }

    @Test
    void shouldNotAuthenticateWithEmptyAuthorizationHeader() throws Exception {
        // Given: Empty Authorization header
        when(request.getHeader("Authorization")).thenReturn("");

        // When: Filter processes request
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // Then: SecurityContext remains empty
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        assertThat(authentication).isNull();

        verify(jwtTokenProvider, never()).validateToken(any());
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void shouldNotAuthenticateWithNonBearerHeader() throws Exception {
        // Given: Authorization header without "Bearer " prefix
        when(request.getHeader("Authorization")).thenReturn("Basic dXNlcjpwYXNzd29yZA==");

        // When: Filter processes request
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // Then: SecurityContext remains empty
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        assertThat(authentication).isNull();

        verify(jwtTokenProvider, never()).validateToken(any());
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void shouldNotAuthenticateWithBearerOnlyHeader() throws Exception {
        // Given: Authorization header with "Bearer " but no token
        when(request.getHeader("Authorization")).thenReturn("Bearer ");

        // When: Filter processes request
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // Then: SecurityContext remains empty
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        assertThat(authentication).isNull();

        verify(filterChain).doFilter(request, response);
    }

    // ========== Exception Handling Tests ==========

    @Test
    void shouldContinueFilterChainWhenTokenValidationThrowsException() throws Exception {
        // Given: Token validation throws exception
        String token = "malformed.token";
        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);
        when(jwtTokenProvider.validateToken(token)).thenThrow(new RuntimeException("Malformed JWT"));

        // When: Filter processes request
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // Then: Exception caught, SecurityContext remains empty
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        assertThat(authentication).isNull();

        // Filter chain continues (no exception propagated)
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void shouldContinueFilterChainWhenUsernameExtractionThrowsException() throws Exception {
        // Given: Username extraction throws exception
        String token = "valid.token.bad.claims";
        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);
        when(jwtTokenProvider.validateToken(token)).thenReturn(true);
        when(jwtTokenProvider.getUsername(token)).thenThrow(new RuntimeException("Missing subject claim"));

        // When: Filter processes request
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // Then: Exception caught, SecurityContext remains empty
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        assertThat(authentication).isNull();

        // Filter chain continues
        verify(filterChain).doFilter(request, response);
    }
}
