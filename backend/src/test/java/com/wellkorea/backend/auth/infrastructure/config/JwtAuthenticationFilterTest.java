package com.wellkorea.backend.auth.infrastructure.config;

import com.wellkorea.backend.auth.application.TokenBlacklistService;
import com.wellkorea.backend.auth.domain.AuthenticatedUser;
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
 * Tests JWT token extraction, validation, blacklist checking, and SecurityContext population.
 */
@Tag("unit")
@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private TokenBlacklistService tokenBlacklistService;

    @Mock
    private CustomAuthenticationEntryPoint authenticationEntryPoint;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain filterChain;

    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @BeforeEach
    void setUp() {
        jwtAuthenticationFilter = new JwtAuthenticationFilter(
                jwtTokenProvider, tokenBlacklistService, authenticationEntryPoint);
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
        when(tokenBlacklistService.isBlacklisted(token)).thenReturn(false);
        when(jwtTokenProvider.getUsername(token)).thenReturn("testuser");
        when(jwtTokenProvider.getUserId(token)).thenReturn(1L);
        when(jwtTokenProvider.getRoles(token)).thenReturn(new String[]{"ROLE_ADMIN", "ROLE_FINANCE"});

        // When: Filter processes request
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // Then: SecurityContext populated with AuthenticatedUser
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        assertThat(authentication).isNotNull();
        assertThat(authentication.getPrincipal()).isInstanceOf(AuthenticatedUser.class);

        AuthenticatedUser user = (AuthenticatedUser) authentication.getPrincipal();
        assertThat(user.getUsername()).isEqualTo("testuser");
        assertThat(user.getUserId()).isEqualTo(1L);
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
        when(tokenBlacklistService.isBlacklisted(token)).thenReturn(false);
        when(jwtTokenProvider.getUsername(token)).thenReturn("sales");
        when(jwtTokenProvider.getUserId(token)).thenReturn(2L);
        when(jwtTokenProvider.getRoles(token)).thenReturn(new String[]{"ROLE_SALES"});

        // When: Filter processes request
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // Then: Authentication has single authority and correct userId
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        assertThat(authentication).isNotNull();

        AuthenticatedUser user = (AuthenticatedUser) authentication.getPrincipal();
        assertThat(user.getUserId()).isEqualTo(2L);
        assertThat(authentication.getAuthorities())
                .hasSize(1)
                .extracting("authority")
                .containsExactly("ROLE_SALES");

        verify(filterChain).doFilter(request, response);
    }

    // ========== Blacklist Tests ==========

    @Test
    void shouldRejectBlacklistedToken() throws Exception {
        // Given: Token that has been blacklisted (logged out)
        String token = "blacklisted.jwt.token";
        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);
        when(tokenBlacklistService.isBlacklisted(token)).thenReturn(true);

        // When: Filter processes request
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // Then: Entry point is called with InvalidJwtAuthenticationException
        verify(authenticationEntryPoint).commence(eq(request), eq(response), any(InvalidJwtAuthenticationException.class));

        // SecurityContext remains empty
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        assertThat(authentication).isNull();

        // Filter chain does NOT continue
        verify(filterChain, never()).doFilter(request, response);
    }

    // ========== Missing UserId Tests ==========

    @Test
    void shouldRejectTokenWithMissingUserId() throws Exception {
        // Given: Token without userId claim (old token format)
        String token = "old.token.no.userid";
        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);
        when(tokenBlacklistService.isBlacklisted(token)).thenReturn(false);
        when(jwtTokenProvider.getUsername(token)).thenReturn("olduser");
        when(jwtTokenProvider.getUserId(token)).thenReturn(null);
        when(jwtTokenProvider.getRoles(token)).thenReturn(new String[]{"ROLE_ADMIN"});

        // When: Filter processes request
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // Then: Entry point is called with InvalidJwtAuthenticationException
        verify(authenticationEntryPoint).commence(eq(request), eq(response), any(InvalidJwtAuthenticationException.class));

        // SecurityContext remains empty
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        assertThat(authentication).isNull();

        // Filter chain does NOT continue
        verify(filterChain, never()).doFilter(request, response);
    }

    // ========== Invalid Token Tests ==========

    @Test
    void shouldCallEntryPointWithInvalidToken() throws Exception {
        // Given: Invalid JWT token (throws InvalidJwtAuthenticationException)
        String token = "invalid.jwt.token";
        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);
        doThrow(new InvalidJwtAuthenticationException("Invalid token"))
                .when(jwtTokenProvider).validateToken(token);

        // When: Filter processes request
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // Then: Entry point is called with exception
        verify(authenticationEntryPoint).commence(eq(request), eq(response), any(InvalidJwtAuthenticationException.class));

        // SecurityContext remains empty
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        assertThat(authentication).isNull();

        // Filter chain does NOT continue (stopped by entry point)
        verify(filterChain, never()).doFilter(request, response);
    }

    @Test
    void shouldCallEntryPointWithExpiredToken() throws Exception {
        // Given: Expired token (throws ExpiredJwtAuthenticationException)
        String token = "expired.jwt.token";
        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);
        doThrow(new ExpiredJwtAuthenticationException("Token has expired"))
                .when(jwtTokenProvider).validateToken(token);

        // When: Filter processes request
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // Then: Entry point is called with expired exception (triggers AUTH_003)
        verify(authenticationEntryPoint).commence(eq(request), eq(response), any(ExpiredJwtAuthenticationException.class));

        // SecurityContext remains empty
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        assertThat(authentication).isNull();

        // Filter chain does NOT continue
        verify(filterChain, never()).doFilter(request, response);
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
    void shouldHandleGenericExceptionAndCallEntryPoint() throws Exception {
        // Given: Token validation throws non-JWT exception
        String token = "malformed.token";
        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);
        doThrow(new RuntimeException("Unexpected error"))
                .when(jwtTokenProvider).validateToken(token);

        // When: Filter processes request
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // Then: Entry point is called with wrapped exception (InvalidJwtAuthenticationException)
        verify(authenticationEntryPoint).commence(eq(request), eq(response), any(InvalidJwtAuthenticationException.class));

        // SecurityContext remains empty
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        assertThat(authentication).isNull();

        // Filter chain does NOT continue (stopped by entry point)
        verify(filterChain, never()).doFilter(request, response);
    }

    @Test
    void shouldHandleUsernameExtractionException() throws Exception {
        // Given: Username extraction throws exception (after validation)
        String token = "valid.token.bad.claims";
        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);
        when(tokenBlacklistService.isBlacklisted(token)).thenReturn(false);
        when(jwtTokenProvider.getUsername(token)).thenThrow(new RuntimeException("Missing subject claim"));

        // When: Filter processes request
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // Then: Entry point is called with wrapped exception
        verify(authenticationEntryPoint).commence(eq(request), eq(response), any(InvalidJwtAuthenticationException.class));

        // SecurityContext remains empty
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        assertThat(authentication).isNull();

        // Filter chain does NOT continue
        verify(filterChain, never()).doFilter(request, response);
    }
}
