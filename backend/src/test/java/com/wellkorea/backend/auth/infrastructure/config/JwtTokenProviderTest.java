package com.wellkorea.backend.auth.infrastructure.config;

import com.wellkorea.backend.shared.test.TestFixtures;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

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

    // ========== Token Generation Tests ==========

    @Test
    void shouldGenerateTokenFromUsernameAndRoles() {
        // Given: Username and roles as strings
        String username = "admin";
        String roles = "ROLE_ADMIN,ROLE_SALES";

        // When: Generate token (with userId)
        String token = jwtTokenProvider.generateToken(username, roles, 1L);

        // Then: Token is valid and contains correct claims
        assertThat(token).isNotBlank();
        jwtTokenProvider.validateToken(token); // Should not throw exception
        assertThat(jwtTokenProvider.getUsername(token)).isEqualTo(username);
        assertThat(jwtTokenProvider.getRoles(token)).containsExactly("ROLE_ADMIN", "ROLE_SALES");
        assertThat(jwtTokenProvider.getUserId(token)).isEqualTo(1L);
    }

    @Test
    void shouldGenerateTokenWithSingleRole() {
        // Given: Token with single role
        String token = jwtTokenProvider.generateToken("manager", "ROLE_PRODUCTION", 1L);

        // Then: Token contains single role
        assertThat(jwtTokenProvider.getRoles(token)).containsExactly("ROLE_PRODUCTION");
    }

    @Test
    void shouldGenerateTokenWithNoRoles() {
        // Given: Token with empty roles
        String token = jwtTokenProvider.generateToken("guest", "", 1L);

        // Then: Token has empty roles array
        assertThat(jwtTokenProvider.getRoles(token)).isEmpty();
    }

    // ========== Token Validation Tests ==========

    @Test
    void shouldValidateValidToken() {
        // Given: Valid token
        String token = jwtTokenProvider.generateToken("user", "ROLE_USER", 1L);

        // When/Then: Validate token (should not throw exception)
        jwtTokenProvider.validateToken(token);
    }

    @Test
    void shouldRejectExpiredToken() {
        // Given: Token with immediate expiration
        JwtTokenProvider shortLivedProvider = new JwtTokenProvider(TestFixtures.JWT_SECRET, 1L);
        String token = shortLivedProvider.generateToken("user", "ROLE_USER", 1L);

        // Wait for expiration
        try {
            Thread.sleep(10);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        // When/Then: Validate expired token (should throw ExpiredJwtAuthenticationException)
        assertThatThrownBy(() -> shortLivedProvider.validateToken(token))
                .isInstanceOf(ExpiredJwtAuthenticationException.class)
                .hasMessageContaining("expired");
    }

    @Test
    void shouldRejectMalformedToken() {
        // Given: Malformed token (not JWT format)
        String malformedToken = "this.is.not.a.valid.jwt";

        // When/Then: Validate malformed token (should throw InvalidJwtAuthenticationException)
        assertThatThrownBy(() -> jwtTokenProvider.validateToken(malformedToken))
                .isInstanceOf(InvalidJwtAuthenticationException.class)
                .hasMessageContaining("Invalid token");
    }

    @Test
    void shouldRejectTamperedToken() {
        // Given: Valid token that's been tampered with
        String validToken = jwtTokenProvider.generateToken("user", "ROLE_USER", 1L);
        String tamperedToken = validToken.substring(0, validToken.length() - 5) + "XXXXX";

        // When/Then: Validate tampered token (should throw InvalidJwtAuthenticationException)
        assertThatThrownBy(() -> jwtTokenProvider.validateToken(tamperedToken))
                .isInstanceOf(InvalidJwtAuthenticationException.class)
                .hasMessageContaining("Invalid token");
    }

    @Test
    void shouldRejectTokenSignedWithDifferentSecret() {
        // Given: Token signed with different secret
        String differentSecret = "different-secret-key-with-256-bits-minimum-required";
        JwtTokenProvider otherProvider = new JwtTokenProvider(differentSecret, TestFixtures.JWT_EXPIRATION_MS);
        String token = otherProvider.generateToken("user", "ROLE_USER", 1L);

        // When/Then: Validate with original provider (should throw InvalidJwtAuthenticationException)
        assertThatThrownBy(() -> jwtTokenProvider.validateToken(token))
                .isInstanceOf(InvalidJwtAuthenticationException.class)
                .hasMessageContaining("Invalid token");
    }

    @Test
    void shouldRejectNullToken() {
        // Given: Null token
        String nullToken = null;

        // When/Then: Validate null token (should throw InvalidJwtAuthenticationException)
        assertThatThrownBy(() -> jwtTokenProvider.validateToken(nullToken))
                .isInstanceOf(InvalidJwtAuthenticationException.class)
                .hasMessageContaining("Invalid token");
    }

    @Test
    void shouldRejectEmptyToken() {
        // Given: Empty token
        String emptyToken = "";

        // When/Then: Validate empty token (should throw InvalidJwtAuthenticationException)
        assertThatThrownBy(() -> jwtTokenProvider.validateToken(emptyToken))
                .isInstanceOf(InvalidJwtAuthenticationException.class)
                .hasMessageContaining("Invalid token");
    }

    // ========== Claims Extraction Tests ==========

    @Test
    void shouldExtractUsernameFromToken() {
        // Given: Token with username
        String expectedUsername = "testuser";
        String token = jwtTokenProvider.generateToken(expectedUsername, "ROLE_USER", 1L);

        // When: Extract username
        String actualUsername = jwtTokenProvider.getUsername(token);

        // Then: Username matches
        assertThat(actualUsername).isEqualTo(expectedUsername);
    }

    @Test
    void shouldExtractRolesFromToken() {
        // Given: Token with multiple roles
        String rolesString = "ROLE_ADMIN,ROLE_FINANCE,ROLE_SALES";
        String token = jwtTokenProvider.generateToken("admin", rolesString, 1L);

        // When: Extract roles
        String[] actualRoles = jwtTokenProvider.getRoles(token);

        // Then: Roles match
        assertThat(actualRoles).containsExactly("ROLE_ADMIN", "ROLE_FINANCE", "ROLE_SALES");
    }
}
