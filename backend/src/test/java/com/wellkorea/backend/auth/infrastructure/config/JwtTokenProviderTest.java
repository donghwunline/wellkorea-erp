package com.wellkorea.backend.auth.infrastructure.config;

import com.wellkorea.backend.shared.test.TestFixtures;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.Collection;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Unit tests for JwtTokenProvider.
 * Tests JWT token generation, validation, claims extraction, and header parsing.
 */
@Tag("unit")
class JwtTokenProviderTest {

    private JwtTokenProvider jwtTokenProvider;

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider(TestFixtures.JWT_SECRET, TestFixtures.JWT_EXPIRATION_MS);
    }

    // ========== Constructor Tests ==========

    @Test
    void shouldCreateProviderWithValidSecret() {
        // Given: Valid secret (32+ bytes)
        String validSecret = "this-is-a-valid-secret-key-with-256-bits-minimum";

        // When: Create provider
        JwtTokenProvider provider = new JwtTokenProvider(validSecret, TestFixtures.JWT_EXPIRATION_MS);

        // Then: Provider created successfully
        assertThat(provider).isNotNull();
    }

    @Test
    void shouldRejectShortSecret() {
        // Given: Secret less than 256 bits (32 bytes)
        String shortSecret = "short-key";

        // When/Then: Constructor throws exception
        assertThatThrownBy(() -> new JwtTokenProvider(shortSecret, TestFixtures.JWT_EXPIRATION_MS))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("JWT secret must be at least 256 bits");
    }

    // ========== Token Generation Tests (Authentication Object) ==========

    @Test
    void shouldGenerateTokenFromAuthentication() {
        // Given: Mock Authentication with username and roles
        Authentication auth = mockAuthentication("testuser", List.of("ROLE_ADMIN", "ROLE_FINANCE"));

        // When: Generate token
        String token = jwtTokenProvider.generateToken(auth);

        // Then: Token is valid and contains correct claims
        assertThat(token).isNotBlank();
        assertThat(jwtTokenProvider.validateToken(token)).isTrue();
        assertThat(jwtTokenProvider.getUsername(token)).isEqualTo("testuser");
        assertThat(jwtTokenProvider.getRoles(token)).isEqualTo("ROLE_ADMIN,ROLE_FINANCE");
    }

    @Test
    void shouldGenerateTokenWithSingleRole() {
        // Given: Authentication with single role
        Authentication auth = mockAuthentication("manager", List.of("ROLE_PRODUCTION"));

        // When: Generate token
        String token = jwtTokenProvider.generateToken(auth);

        // Then: Token contains single role
        assertThat(jwtTokenProvider.getRoles(token)).isEqualTo("ROLE_PRODUCTION");
    }

    @Test
    void shouldGenerateTokenWithNoRoles() {
        // Given: Authentication with empty roles
        Authentication auth = mockAuthentication("guest", List.of());

        // When: Generate token
        String token = jwtTokenProvider.generateToken(auth);

        // Then: Token has empty roles claim
        assertThat(jwtTokenProvider.getRoles(token)).isEmpty();
    }

    // ========== Token Generation Tests (String Parameters) ==========

    @Test
    void shouldGenerateTokenFromUsernameAndRoles() {
        // Given: Username and roles as strings
        String username = "admin";
        String roles = "ROLE_ADMIN,ROLE_SALES";

        // When: Generate token
        String token = jwtTokenProvider.generateToken(username, roles);

        // Then: Token is valid and contains correct claims
        assertThat(token).isNotBlank();
        assertThat(jwtTokenProvider.validateToken(token)).isTrue();
        assertThat(jwtTokenProvider.getUsername(token)).isEqualTo(username);
        assertThat(jwtTokenProvider.getRoles(token)).isEqualTo(roles);
    }

    // ========== Token Validation Tests ==========

    @Test
    void shouldValidateValidToken() {
        // Given: Valid token
        String token = jwtTokenProvider.generateToken("user", "ROLE_USER");

        // When: Validate token
        boolean isValid = jwtTokenProvider.validateToken(token);

        // Then: Token is valid
        assertThat(isValid).isTrue();
    }

    @Test
    void shouldRejectExpiredToken() {
        // Given: Token with immediate expiration
        JwtTokenProvider shortLivedProvider = new JwtTokenProvider(TestFixtures.JWT_SECRET, 1L);
        String token = shortLivedProvider.generateToken("user", "ROLE_USER");

        // Wait for expiration
        try {
            Thread.sleep(10);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        // When: Validate expired token
        boolean isValid = shortLivedProvider.validateToken(token);

        // Then: Token is invalid
        assertThat(isValid).isFalse();
    }

    @Test
    void shouldRejectMalformedToken() {
        // Given: Malformed token (not JWT format)
        String malformedToken = "this.is.not.a.valid.jwt";

        // When: Validate malformed token
        boolean isValid = jwtTokenProvider.validateToken(malformedToken);

        // Then: Token is invalid
        assertThat(isValid).isFalse();
    }

    @Test
    void shouldRejectTamperedToken() {
        // Given: Valid token that's been tampered with
        String validToken = jwtTokenProvider.generateToken("user", "ROLE_USER");
        String tamperedToken = validToken.substring(0, validToken.length() - 5) + "XXXXX";

        // When: Validate tampered token
        boolean isValid = jwtTokenProvider.validateToken(tamperedToken);

        // Then: Token is invalid
        assertThat(isValid).isFalse();
    }

    @Test
    void shouldRejectTokenSignedWithDifferentSecret() {
        // Given: Token signed with different secret
        String differentSecret = "different-secret-key-with-256-bits-minimum-required";
        JwtTokenProvider otherProvider = new JwtTokenProvider(differentSecret, TestFixtures.JWT_EXPIRATION_MS);
        String token = otherProvider.generateToken("user", "ROLE_USER");

        // When: Validate with original provider
        boolean isValid = jwtTokenProvider.validateToken(token);

        // Then: Token is invalid (signature mismatch)
        assertThat(isValid).isFalse();
    }

    @Test
    void shouldRejectNullToken() {
        // Given: Null token
        String nullToken = null;

        // When: Validate null token
        boolean isValid = jwtTokenProvider.validateToken(nullToken);

        // Then: Token is invalid
        assertThat(isValid).isFalse();
    }

    @Test
    void shouldRejectEmptyToken() {
        // Given: Empty token
        String emptyToken = "";

        // When: Validate empty token
        boolean isValid = jwtTokenProvider.validateToken(emptyToken);

        // Then: Token is invalid
        assertThat(isValid).isFalse();
    }

    // ========== Claims Extraction Tests ==========

    @Test
    void shouldExtractUsernameFromToken() {
        // Given: Token with username
        String expectedUsername = "testuser";
        String token = jwtTokenProvider.generateToken(expectedUsername, "ROLE_USER");

        // When: Extract username
        String actualUsername = jwtTokenProvider.getUsername(token);

        // Then: Username matches
        assertThat(actualUsername).isEqualTo(expectedUsername);
    }

    @Test
    void shouldExtractRolesFromToken() {
        // Given: Token with multiple roles
        String expectedRoles = "ROLE_ADMIN,ROLE_FINANCE,ROLE_SALES";
        String token = jwtTokenProvider.generateToken("admin", expectedRoles);

        // When: Extract roles
        String actualRoles = jwtTokenProvider.getRoles(token);

        // Then: Roles match
        assertThat(actualRoles).isEqualTo(expectedRoles);
    }

    // ========== Header Extraction Tests ==========

    @Test
    void shouldExtractTokenFromBearerHeader() {
        // Given: Authorization header with Bearer token
        String token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature";
        String authHeader = "Bearer " + token;

        // When: Extract token
        String extractedToken = jwtTokenProvider.extractTokenFromHeader(authHeader);

        // Then: Token extracted correctly
        assertThat(extractedToken).isEqualTo(token);
    }

    @Test
    void shouldReturnNullForNonBearerHeader() {
        // Given: Authorization header without Bearer prefix
        String authHeader = "Basic dXNlcjpwYXNzd29yZA==";

        // When: Extract token
        String extractedToken = jwtTokenProvider.extractTokenFromHeader(authHeader);

        // Then: No token extracted
        assertThat(extractedToken).isNull();
    }

    @Test
    void shouldReturnNullForNullHeader() {
        // Given: Null authorization header
        String authHeader = null;

        // When: Extract token
        String extractedToken = jwtTokenProvider.extractTokenFromHeader(authHeader);

        // Then: No token extracted
        assertThat(extractedToken).isNull();
    }

    @Test
    void shouldReturnNullForEmptyHeader() {
        // Given: Empty authorization header
        String authHeader = "";

        // When: Extract token
        String extractedToken = jwtTokenProvider.extractTokenFromHeader(authHeader);

        // Then: No token extracted
        assertThat(extractedToken).isNull();
    }

    // ========== Helper Methods ==========

    private Authentication mockAuthentication(String username, List<String> roles) {
        Authentication auth = mock(Authentication.class);
        when(auth.getName()).thenReturn(username);

        Collection<GrantedAuthority> authorities = roles.stream()
                .map(SimpleGrantedAuthority::new)
                .map(authority -> (GrantedAuthority) authority)
                .toList();
        when(auth.getAuthorities()).thenAnswer(invocation -> authorities);

        return auth;
    }
}
