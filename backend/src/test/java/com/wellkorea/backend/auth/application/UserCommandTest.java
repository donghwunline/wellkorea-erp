package com.wellkorea.backend.auth.application;

import com.wellkorea.backend.auth.domain.User;
import com.wellkorea.backend.auth.domain.vo.Role;
import com.wellkorea.backend.auth.infrastructure.persistence.UserRepository;
import com.wellkorea.backend.shared.test.TestFixtures;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Unit tests for UserCommand operations.
 * Tests write/mutation user operations following CQRS pattern.
 * <p>
 * Test-First Development: These tests MUST be written FIRST and MUST FAIL initially.
 * Per Constitution Principle I (Test-First Development).
 * <p>
 * T036: Unit tests for UserService - Command operations
 */
@Tag("unit")
@ExtendWith(MockitoExtension.class)
@DisplayName("UserCommand Unit Tests")
class UserCommandTest implements TestFixtures {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    private User adminUser;
    private User inactiveUser;
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

        inactiveUser = User.builder()
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
    @DisplayName("createUser")
    class CreateUserTests {

        @Test
        @DisplayName("should create user and return ID")
        void createUser_WithValidData_ReturnsUserId() {
            when(userRepository.existsByUsername(anyString())).thenReturn(false);
            when(userRepository.existsByEmail(anyString())).thenReturn(false);
            when(passwordEncoder.encode(TEST_PASSWORD)).thenReturn(TEST_PASSWORD_HASH);
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
                User user = invocation.getArgument(0);
                return user.withId(1L);
            });

            Long result = userService.createUser(
                    "newuser",
                    "newuser@wellkorea.com",
                    TEST_PASSWORD,
                    "New User",
                    Set.of(Role.SALES)
            );

            assertThat(result).isEqualTo(1L);
            verify(passwordEncoder).encode(TEST_PASSWORD);
            verify(userRepository).save(any(User.class));
        }

        @Test
        @DisplayName("should create user with encoded password")
        void createUser_EncodesPassword() {
            when(userRepository.existsByUsername(anyString())).thenReturn(false);
            when(userRepository.existsByEmail(anyString())).thenReturn(false);
            when(passwordEncoder.encode(TEST_PASSWORD)).thenReturn(TEST_PASSWORD_HASH);
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
                User user = invocation.getArgument(0);
                return user.withId(1L);
            });

            userService.createUser(
                    "newuser",
                    "newuser@wellkorea.com",
                    TEST_PASSWORD,
                    "New User",
                    Set.of(Role.SALES)
            );

            ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
            verify(userRepository).save(userCaptor.capture());
            assertThat(userCaptor.getValue().getPasswordHash()).isEqualTo(TEST_PASSWORD_HASH);
        }

        @Test
        @DisplayName("should create user with multiple roles")
        void createUser_WithMultipleRoles_SavesAllRoles() {
            Set<Role> roles = Set.of(Role.ADMIN, Role.FINANCE);
            when(userRepository.existsByUsername(anyString())).thenReturn(false);
            when(userRepository.existsByEmail(anyString())).thenReturn(false);
            when(passwordEncoder.encode(TEST_PASSWORD)).thenReturn(TEST_PASSWORD_HASH);
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
                User user = invocation.getArgument(0);
                return user.withId(1L);
            });

            userService.createUser(
                    "multiuser",
                    "multi@wellkorea.com",
                    TEST_PASSWORD,
                    "Multi Role User",
                    roles
            );

            ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
            verify(userRepository).save(userCaptor.capture());
            assertThat(userCaptor.getValue().getRoles()).containsExactlyInAnyOrder(Role.ADMIN, Role.FINANCE);
        }

        @Test
        @DisplayName("should throw exception on duplicate username")
        void createUser_DuplicateUsername_ThrowsException() {
            when(userRepository.existsByUsername(ADMIN_USERNAME)).thenReturn(true);

            assertThatThrownBy(() -> userService.createUser(
                    ADMIN_USERNAME,
                    "different@wellkorea.com",
                    TEST_PASSWORD,
                    "Another Admin",
                    Set.of(Role.ADMIN)
            ))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Username already exists");

            verify(userRepository, never()).save(any(User.class));
        }

        @Test
        @DisplayName("should throw exception on duplicate email")
        void createUser_DuplicateEmail_ThrowsException() {
            when(userRepository.existsByUsername(anyString())).thenReturn(false);
            when(userRepository.existsByEmail("admin@wellkorea.com")).thenReturn(true);

            assertThatThrownBy(() -> userService.createUser(
                    "differentuser",
                    "admin@wellkorea.com",
                    TEST_PASSWORD,
                    "Different User",
                    Set.of(Role.SALES)
            ))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Email already exists");

            verify(userRepository, never()).save(any(User.class));
        }
    }

    @Nested
    @DisplayName("updateUser")
    class UpdateUserTests {

        @Test
        @DisplayName("should update user fields")
        void updateUser_ValidData_UpdatesUser() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));
            when(userRepository.existsByEmailAndIdNot("updated@wellkorea.com", 1L)).thenReturn(false);
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

            userService.updateUser(1L, "Updated Name", "updated@wellkorea.com");

            ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
            verify(userRepository).save(userCaptor.capture());
            assertThat(userCaptor.getValue().getFullName()).isEqualTo("Updated Name");
            assertThat(userCaptor.getValue().getEmail()).isEqualTo("updated@wellkorea.com");
        }

        @Test
        @DisplayName("should throw exception for non-existent user")
        void updateUser_NonExistentUser_ThrowsException() {
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> userService.updateUser(999L, "Updated Name", "updated@wellkorea.com"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("User not found");

            verify(userRepository, never()).save(any(User.class));
        }

        @Test
        @DisplayName("should throw exception on duplicate email")
        void updateUser_DuplicateEmail_ThrowsException() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));
            when(userRepository.existsByEmailAndIdNot("existing@wellkorea.com", 1L)).thenReturn(true);

            assertThatThrownBy(() -> userService.updateUser(1L, "Updated Name", "existing@wellkorea.com"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Email already exists");

            verify(userRepository, never()).save(any(User.class));
        }
    }

    @Nested
    @DisplayName("assignRoles")
    class AssignRolesTests {

        @Test
        @DisplayName("should replace user roles")
        void assignRoles_ValidRoles_ReplacesRoles() {
            when(userRepository.findById(3L)).thenReturn(Optional.of(salesUser));
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

            userService.assignRoles(3L, Set.of(Role.SALES, Role.FINANCE));

            ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
            verify(userRepository).save(userCaptor.capture());
            assertThat(userCaptor.getValue().getRoles()).containsExactlyInAnyOrder(Role.SALES, Role.FINANCE);
        }

        @Test
        @DisplayName("should throw exception for non-existent user")
        void assignRoles_NonExistentUser_ThrowsException() {
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> userService.assignRoles(999L, Set.of(Role.ADMIN)))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("User not found");

            verify(userRepository, never()).save(any(User.class));
        }
    }

    @Nested
    @DisplayName("deactivateUser")
    class DeactivateUserTests {

        @Test
        @DisplayName("should deactivate user")
        void deactivateUser_ActiveUser_DeactivatesUser() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

            userService.deactivateUser(1L);

            ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
            verify(userRepository).save(userCaptor.capture());
            assertThat(userCaptor.getValue().isActive()).isFalse();
        }

        @Test
        @DisplayName("should throw exception for non-existent user")
        void deactivateUser_NonExistentUser_ThrowsException() {
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> userService.deactivateUser(999L))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("User not found");

            verify(userRepository, never()).save(any(User.class));
        }
    }

    @Nested
    @DisplayName("activateUser")
    class ActivateUserTests {

        @Test
        @DisplayName("should activate inactive user")
        void activateUser_InactiveUser_ActivatesUser() {
            when(userRepository.findById(2L)).thenReturn(Optional.of(inactiveUser));
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

            userService.activateUser(2L);

            ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
            verify(userRepository).save(userCaptor.capture());
            assertThat(userCaptor.getValue().isActive()).isTrue();
        }

        @Test
        @DisplayName("should throw exception for non-existent user")
        void activateUser_NonExistentUser_ThrowsException() {
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> userService.activateUser(999L))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("User not found");

            verify(userRepository, never()).save(any(User.class));
        }
    }

    @Nested
    @DisplayName("changePassword")
    class ChangePasswordTests {

        @Test
        @DisplayName("should change password with encoding")
        void changePassword_ValidData_ChangesPassword() {
            String newPassword = "newSecurePassword123";
            String newPasswordHash = "$2a$10$newHashValue";
            when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));
            when(passwordEncoder.encode(newPassword)).thenReturn(newPasswordHash);
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

            userService.changePassword(1L, newPassword);

            verify(passwordEncoder).encode(newPassword);
            ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
            verify(userRepository).save(userCaptor.capture());
            assertThat(userCaptor.getValue().getPasswordHash()).isEqualTo(newPasswordHash);
        }

        @Test
        @DisplayName("should throw exception for non-existent user")
        void changePassword_NonExistentUser_ThrowsException() {
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> userService.changePassword(999L, "newPassword"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("User not found");

            verify(userRepository, never()).save(any(User.class));
        }
    }
}
