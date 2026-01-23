package com.wellkorea.backend.auth.application;

import com.wellkorea.backend.auth.api.dto.UserResponse;
import com.wellkorea.backend.auth.domain.User;
import com.wellkorea.backend.auth.domain.vo.Role;
import com.wellkorea.backend.auth.infrastructure.persistence.UserRepository;
import com.wellkorea.backend.shared.test.TestFixtures;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

/**
 * Unit tests for UserQuery operations.
 * Tests read-only user operations following CQRS pattern.
 * UserQuery returns DTOs directly (not entities).
 * <p>
 * Test-First Development: These tests MUST be written FIRST and MUST FAIL initially.
 * Per Constitution Principle I (Test-First Development).
 * <p>
 * T036: Unit tests for UserService - Query operations
 */
@Tag("unit")
@ExtendWith(MockitoExtension.class)
@DisplayName("UserQuery Unit Tests")
class UserQueryTest implements TestFixtures {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    private User adminUser;
    private User financeUser;
    private User salesUser;

    @BeforeEach
    void setUp() {
        adminUser = User.builder()
                .id(1L)
                .username(ADMIN_USERNAME)
                .email("admin@wellkorea.com")
                .passwordHash(TEST_PASSWORD_HASH)
                .fullName("Admin User")
                .isActive(true)
                .roles(Set.of(Role.ADMIN))
                .build();

        financeUser = User.builder()
                .id(2L)
                .username(FINANCE_USERNAME)
                .email("finance@wellkorea.com")
                .passwordHash(TEST_PASSWORD_HASH)
                .fullName("Finance User")
                .isActive(false)
                .roles(Set.of(Role.FINANCE))
                .build();

        salesUser = User.builder()
                .id(3L)
                .username(SALES_USERNAME)
                .email("sales@wellkorea.com")
                .passwordHash(TEST_PASSWORD_HASH)
                .fullName("Sales User")
                .isActive(true)
                .roles(Set.of(Role.SALES))
                .build();
    }

    @Nested
    @DisplayName("getUserById")
    class GetUserByIdTests {

        @Test
        @DisplayName("should return UserResponse when user found")
        void getUserById_ExistingUser_ReturnsUserResponse() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));

            Optional<UserResponse> result = userService.getUserById(1L);

            assertThat(result).isPresent();
            assertThat(result.get().id()).isEqualTo(1L);
            assertThat(result.get().username()).isEqualTo(ADMIN_USERNAME);
            assertThat(result.get().email()).isEqualTo("admin@wellkorea.com");
            assertThat(result.get().fullName()).isEqualTo("Admin User");
            assertThat(result.get().isActive()).isTrue();
            assertThat(result.get().roles()).contains(Role.ADMIN.getAuthority());
        }

        @Test
        @DisplayName("should return empty when user not found")
        void getUserById_NonExistentUser_ReturnsEmpty() {
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            Optional<UserResponse> result = userService.getUserById(999L);

            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("getAllUsers")
    class GetAllUsersTests {

        @Test
        @DisplayName("should return page of UserResponses")
        void getAllUsers_ReturnsPageOfUserResponses() {
            Pageable pageable = PageRequest.of(0, 10);
            Page<User> userPage = new PageImpl<>(List.of(adminUser, financeUser, salesUser), pageable, 3);
            when(userRepository.findAll(pageable)).thenReturn(userPage);

            Page<UserResponse> result = userService.getAllUsers(pageable);

            assertThat(result.getContent()).hasSize(3);
            assertThat(result.getContent())
                    .extracting(UserResponse::username)
                    .containsExactlyInAnyOrder(ADMIN_USERNAME, FINANCE_USERNAME, SALES_USERNAME);
        }

        @Test
        @DisplayName("should return empty page when no users")
        void getAllUsers_NoUsers_ReturnsEmptyPage() {
            Pageable pageable = PageRequest.of(0, 10);
            Page<User> emptyPage = new PageImpl<>(List.of(), pageable, 0);
            when(userRepository.findAll(pageable)).thenReturn(emptyPage);

            Page<UserResponse> result = userService.getAllUsers(pageable);

            assertThat(result.getContent()).isEmpty();
            assertThat(result.getTotalElements()).isZero();
        }
    }

    @Nested
    @DisplayName("getActiveUsers")
    class GetActiveUsersTests {

        @Test
        @DisplayName("should return only active users")
        void getActiveUsers_ReturnsOnlyActiveUsers() {
            Pageable pageable = PageRequest.of(0, 10);
            Page<User> activePage = new PageImpl<>(List.of(adminUser, salesUser), pageable, 2);
            when(userRepository.findByIsActiveTrue(pageable)).thenReturn(activePage);

            Page<UserResponse> result = userService.getActiveUsers(pageable);

            assertThat(result.getContent()).hasSize(2);
            assertThat(result.getContent()).allMatch(UserResponse::isActive);
            assertThat(result.getContent())
                    .extracting(UserResponse::username)
                    .containsExactlyInAnyOrder(ADMIN_USERNAME, SALES_USERNAME);
        }

        @Test
        @DisplayName("should return empty page when no active users")
        void getActiveUsers_NoActiveUsers_ReturnsEmptyPage() {
            Pageable pageable = PageRequest.of(0, 10);
            Page<User> emptyPage = new PageImpl<>(List.of(), pageable, 0);
            when(userRepository.findByIsActiveTrue(pageable)).thenReturn(emptyPage);

            Page<UserResponse> result = userService.getActiveUsers(pageable);

            assertThat(result.getContent()).isEmpty();
        }
    }

    @Nested
    @DisplayName("searchUsers")
    class SearchUsersTests {

        @Test
        @DisplayName("should return users matching search term")
        void searchUsers_MatchingTerm_ReturnsMatchingUsers() {
            Pageable pageable = PageRequest.of(0, 10);
            Page<User> searchResult = new PageImpl<>(List.of(adminUser), pageable, 1);
            when(userRepository.searchByUsernameOrEmail("admin", pageable)).thenReturn(searchResult);

            Page<UserResponse> result = userService.searchUsers("admin", pageable);

            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().getFirst().username()).isEqualTo(ADMIN_USERNAME);
        }

        @Test
        @DisplayName("should return empty page when no matches")
        void searchUsers_NoMatches_ReturnsEmptyPage() {
            Pageable pageable = PageRequest.of(0, 10);
            Page<User> emptyResult = new PageImpl<>(List.of(), pageable, 0);
            when(userRepository.searchByUsernameOrEmail("nonexistent", pageable)).thenReturn(emptyResult);

            Page<UserResponse> result = userService.searchUsers("nonexistent", pageable);

            assertThat(result.getContent()).isEmpty();
        }

        @Test
        @DisplayName("should search by email")
        void searchUsers_ByEmail_ReturnsMatchingUsers() {
            Pageable pageable = PageRequest.of(0, 10);
            Page<User> searchResult = new PageImpl<>(List.of(salesUser), pageable, 1);
            when(userRepository.searchByUsernameOrEmail("sales@", pageable)).thenReturn(searchResult);

            Page<UserResponse> result = userService.searchUsers("sales@", pageable);

            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().getFirst().email()).contains("sales@");
        }
    }
}
