package com.wellkorea.backend.auth.application;

import com.wellkorea.backend.auth.api.dto.LoginResponse;
import com.wellkorea.backend.auth.domain.Role;
import com.wellkorea.backend.auth.domain.User;
import com.wellkorea.backend.auth.infrastructure.config.JwtTokenProvider;
import com.wellkorea.backend.auth.infrastructure.persistence.UserRepository;
import com.wellkorea.backend.shared.test.TestFixtures;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Unit tests for AuthenticationService.
 * Tests authentication operations (login, logout, token refresh).
 * <p>
 * Test-First Development: These tests MUST be written FIRST and MUST FAIL initially.
 * Per Constitution Principle I (Test-First Development).
 * <p>
 * T037: Unit tests for AuthenticationService
 */
@Tag("unit")
@ExtendWith(MockitoExtension.class)
@DisplayName("AuthenticationService Unit Tests")
class AuthenticationServiceTest implements TestFixtures {

    @Mock
    private UserRepository userRepository;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthenticationService authenticationService;

    private User activeUser;
    private User inactiveUser;

    @BeforeEach
    void setUp() {
        activeUser = User.builder()
                .id(1L)
                .username(ADMIN_USERNAME)
                .email("admin@wellkorea.com")
                .passwordHash(TEST_PASSWORD_HASH)
                .fullName("Admin User")
                .isActive(true)
                .roles(Set.of(Role.ADMIN))
                .build();

        inactiveUser = User.builder()
                .id(2L)
                .username(FINANCE_USERNAME)
                .email("finance@wellkorea.com")
                .passwordHash(TEST_PASSWORD_HASH)
                .fullName("Finance User")
                .isActive(false)
                .roles(Set.of(Role.FINANCE))
                .build();
    }

    @Nested
    @DisplayName("login")
    class LoginTests {

        @Test
        @DisplayName("should return LoginResponse with token for valid credentials")
        void login_ValidCredentials_ReturnsLoginResponse() {
            when(userRepository.findByUsername(ADMIN_USERNAME)).thenReturn(Optional.of(activeUser));
            when(passwordEncoder.matches(TEST_PASSWORD, TEST_PASSWORD_HASH)).thenReturn(true);
            when(jwtTokenProvider.generateToken(ADMIN_USERNAME, Role.ADMIN.getAuthority()))
                    .thenReturn("generated.jwt.token");

            LoginResponse result = authenticationService.login(ADMIN_USERNAME, TEST_PASSWORD);

            assertThat(result).isNotNull();
            assertThat(result.accessToken()).isEqualTo("generated.jwt.token");
            assertThat(result.user()).isNotNull();
            assertThat(result.user().username()).isEqualTo(ADMIN_USERNAME);
            assertThat(result.user().roles()).contains(Role.ADMIN.getAuthority());
            verify(jwtTokenProvider).generateToken(ADMIN_USERNAME, Role.ADMIN.getAuthority());
        }

        @Test
        @DisplayName("should return LoginResponse with multiple roles")
        void login_UserWithMultipleRoles_ReturnsAllRoles() {
            User multiRoleUser = User.builder()
                    .id(3L)
                    .username("multirole")
                    .email("multi@wellkorea.com")
                    .passwordHash(TEST_PASSWORD_HASH)
                    .fullName("Multi Role User")
                    .isActive(true)
                    .roles(Set.of(Role.ADMIN, Role.FINANCE))
                    .build();

            when(userRepository.findByUsername("multirole")).thenReturn(Optional.of(multiRoleUser));
            when(passwordEncoder.matches(TEST_PASSWORD, TEST_PASSWORD_HASH)).thenReturn(true);
            when(jwtTokenProvider.generateToken(anyString(), anyString()))
                    .thenReturn("generated.jwt.token");

            LoginResponse result = authenticationService.login("multirole", TEST_PASSWORD);

            assertThat(result.user().roles()).hasSize(2);
            assertThat(result.user().roles()).containsExactlyInAnyOrder(
                    Role.ADMIN.getAuthority(),
                    Role.FINANCE.getAuthority()
            );
        }

        @Test
        @DisplayName("should throw exception for invalid password")
        void login_InvalidPassword_ThrowsException() {
            when(userRepository.findByUsername(ADMIN_USERNAME)).thenReturn(Optional.of(activeUser));
            when(passwordEncoder.matches("wrongpassword", TEST_PASSWORD_HASH)).thenReturn(false);

            assertThatThrownBy(() -> authenticationService.login(ADMIN_USERNAME, "wrongpassword"))
                    .isInstanceOf(AuthenticationException.class)
                    .hasMessageContaining("Invalid credentials");

            verify(jwtTokenProvider, never()).generateToken(anyString(), anyString());
        }

        @Test
        @DisplayName("should throw exception for non-existent user")
        void login_NonExistentUser_ThrowsException() {
            when(userRepository.findByUsername("nonexistent")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> authenticationService.login("nonexistent", TEST_PASSWORD))
                    .isInstanceOf(AuthenticationException.class)
                    .hasMessageContaining("Invalid credentials");

            verify(jwtTokenProvider, never()).generateToken(anyString(), anyString());
        }

        @Test
        @DisplayName("should throw exception for inactive user")
        void login_InactiveUser_ThrowsException() {
            when(userRepository.findByUsername(FINANCE_USERNAME)).thenReturn(Optional.of(inactiveUser));

            assertThatThrownBy(() -> authenticationService.login(FINANCE_USERNAME, TEST_PASSWORD))
                    .isInstanceOf(AuthenticationException.class)
                    .hasMessageContaining("Invalid credentials");

            verify(jwtTokenProvider, never()).generateToken(anyString(), anyString());
        }

        @Test
        @DisplayName("should throw exception for null username")
        void login_NullUsername_ThrowsException() {
            assertThatThrownBy(() -> authenticationService.login(null, TEST_PASSWORD))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Username is required");
        }

        @Test
        @DisplayName("should throw exception for null password")
        void login_NullPassword_ThrowsException() {
            assertThatThrownBy(() -> authenticationService.login(ADMIN_USERNAME, null))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Password is required");
        }

        @Test
        @DisplayName("should throw exception for empty username")
        void login_EmptyUsername_ThrowsException() {
            assertThatThrownBy(() -> authenticationService.login("", TEST_PASSWORD))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Username is required");
        }

        @Test
        @DisplayName("should throw exception for empty password")
        void login_EmptyPassword_ThrowsException() {
            assertThatThrownBy(() -> authenticationService.login(ADMIN_USERNAME, ""))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Password is required");
        }
    }

    @Nested
    @DisplayName("logout")
    class LogoutTests {

        @Test
        @DisplayName("should invalidate token on logout")
        void logout_ValidToken_InvalidatesToken() {
            String validToken = "valid.jwt.token";
            // validateToken() is void - no need to mock (default behavior is do nothing)

            authenticationService.logout(validToken);

            verify(jwtTokenProvider).validateToken(validToken);
            // Token should be blacklisted - verified by isTokenBlacklisted
            assertThat(authenticationService.isTokenBlacklisted(validToken)).isTrue();
        }

        @Test
        @DisplayName("should throw exception for invalid token")
        void logout_InvalidToken_ThrowsException() {
            doThrow(new com.wellkorea.backend.auth.infrastructure.config.InvalidJwtAuthenticationException("Invalid token"))
                    .when(jwtTokenProvider).validateToken(INVALID_JWT_TOKEN);

            assertThatThrownBy(() -> authenticationService.logout(INVALID_JWT_TOKEN))
                    .isInstanceOf(AuthenticationException.class)
                    .hasMessageContaining("Invalid token");
        }

        @Test
        @DisplayName("should throw exception for null token")
        void logout_NullToken_ThrowsException() {
            assertThatThrownBy(() -> authenticationService.logout(null))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Token is required");
        }

        @Test
        @DisplayName("should throw exception for empty token")
        void logout_EmptyToken_ThrowsException() {
            assertThatThrownBy(() -> authenticationService.logout(""))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Token is required");
        }
    }

    @Nested
    @DisplayName("refreshToken")
    class RefreshTokenTests {

        @Test
        @DisplayName("should return new token for valid refresh token")
        void refreshToken_ValidToken_ReturnsNewToken() {
            String oldToken = "old.valid.token";
            String newToken = "new.generated.token";

            // validateToken() is void - no need to mock
            when(jwtTokenProvider.getUsername(oldToken)).thenReturn(ADMIN_USERNAME);
            when(userRepository.findByUsername(ADMIN_USERNAME)).thenReturn(Optional.of(activeUser));
            when(jwtTokenProvider.generateToken(ADMIN_USERNAME, Role.ADMIN.getAuthority()))
                    .thenReturn(newToken);

            LoginResponse result = authenticationService.refreshToken(oldToken);

            assertThat(result).isNotNull();
            assertThat(result.accessToken()).isEqualTo(newToken);
            // Old token should be blacklisted
            assertThat(authenticationService.isTokenBlacklisted(oldToken)).isTrue();
        }

        @Test
        @DisplayName("should throw exception for expired token")
        void refreshToken_ExpiredToken_ThrowsException() {
            doThrow(new com.wellkorea.backend.auth.infrastructure.config.ExpiredJwtAuthenticationException("Token has expired"))
                    .when(jwtTokenProvider).validateToken(EXPIRED_JWT_TOKEN);

            assertThatThrownBy(() -> authenticationService.refreshToken(EXPIRED_JWT_TOKEN))
                    .isInstanceOf(AuthenticationException.class)
                    .hasMessageContaining("Invalid or expired token");
        }

        @Test
        @DisplayName("should throw exception when user no longer active")
        void refreshToken_InactiveUser_ThrowsException() {
            String validToken = "valid.token";

            // validateToken() is void - no need to mock
            when(jwtTokenProvider.getUsername(validToken)).thenReturn(FINANCE_USERNAME);
            when(userRepository.findByUsername(FINANCE_USERNAME)).thenReturn(Optional.of(inactiveUser));

            assertThatThrownBy(() -> authenticationService.refreshToken(validToken))
                    .isInstanceOf(AuthenticationException.class)
                    .hasMessageContaining("User is not active");
        }

        @Test
        @DisplayName("should throw exception when user no longer exists")
        void refreshToken_DeletedUser_ThrowsException() {
            String validToken = "valid.token";

            // validateToken() is void - no need to mock
            when(jwtTokenProvider.getUsername(validToken)).thenReturn("deleteduser");
            when(userRepository.findByUsername("deleteduser")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> authenticationService.refreshToken(validToken))
                    .isInstanceOf(AuthenticationException.class)
                    .hasMessageContaining("User not found");
        }

        @Test
        @DisplayName("should throw exception for null token")
        void refreshToken_NullToken_ThrowsException() {
            assertThatThrownBy(() -> authenticationService.refreshToken(null))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Token is required");
        }
    }

    @Nested
    @DisplayName("getCurrentUser")
    class GetCurrentUserTests {

        @Test
        @DisplayName("should return user info for valid token")
        void getCurrentUser_ValidToken_ReturnsUserInfo() {
            String validToken = "valid.jwt.token";

            // validateToken() is void - no need to mock
            when(jwtTokenProvider.getUsername(validToken)).thenReturn(ADMIN_USERNAME);
            when(userRepository.findByUsername(ADMIN_USERNAME)).thenReturn(Optional.of(activeUser));

            LoginResponse.UserInfo result = authenticationService.getCurrentUser(validToken);

            assertThat(result).isNotNull();
            assertThat(result.id()).isEqualTo(1L);
            assertThat(result.username()).isEqualTo(ADMIN_USERNAME);
            assertThat(result.fullName()).isEqualTo("Admin User");
            assertThat(result.email()).isEqualTo("admin@wellkorea.com");
            assertThat(result.roles()).contains(Role.ADMIN.getAuthority());
        }

        @Test
        @DisplayName("should throw exception for invalid token")
        void getCurrentUser_InvalidToken_ThrowsException() {
            doThrow(new com.wellkorea.backend.auth.infrastructure.config.InvalidJwtAuthenticationException("Invalid token"))
                    .when(jwtTokenProvider).validateToken(INVALID_JWT_TOKEN);

            assertThatThrownBy(() -> authenticationService.getCurrentUser(INVALID_JWT_TOKEN))
                    .isInstanceOf(AuthenticationException.class)
                    .hasMessageContaining("Invalid token");
        }

        @Test
        @DisplayName("should throw exception when user not found")
        void getCurrentUser_UserNotFound_ThrowsException() {
            String validToken = "valid.token";

            // validateToken() is void - no need to mock
            when(jwtTokenProvider.getUsername(validToken)).thenReturn("deleteduser");
            when(userRepository.findByUsername("deleteduser")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> authenticationService.getCurrentUser(validToken))
                    .isInstanceOf(AuthenticationException.class)
                    .hasMessageContaining("User not found");
        }
    }
}
