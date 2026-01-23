package com.wellkorea.backend.auth.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wellkorea.backend.BaseIntegrationTest;
import com.wellkorea.backend.auth.domain.vo.Role;
import com.wellkorea.backend.auth.infrastructure.config.JwtTokenProvider;
import com.wellkorea.backend.shared.test.DatabaseTestHelper;
import com.wellkorea.backend.shared.test.TestFixtures;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Contract tests for /api/users endpoints.
 * Tests validate the user management API contract (Admin only).
 * <p>
 * Test-First Development: These tests MUST be written FIRST and MUST FAIL initially.
 * Per Constitution Principle I (Test-First Development).
 * <p>
 * T034: GET /api/users, POST /api/users, PUT /api/users/{id} - Admin only
 */
@Tag("integration")
@AutoConfigureMockMvc
@Transactional
@DisplayName("User Controller Contract Tests")
class UserControllerTest extends BaseIntegrationTest implements TestFixtures {

    private static final String USERS_URL = "/api/users";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private String adminToken;
    private String financeToken;
    private String productionToken;
    private String salesToken;

    @BeforeEach
    void setUp() {
        DatabaseTestHelper.insertTestUsersWithRoles(jdbcTemplate);

        // Generate tokens for different roles (userId is required for approval workflows)
        adminToken = jwtTokenProvider.generateToken(ADMIN_USERNAME, Role.ADMIN.getAuthority(), TEST_USER_ID);
        financeToken = jwtTokenProvider.generateToken(FINANCE_USERNAME, Role.FINANCE.getAuthority(), 2L);
        productionToken = jwtTokenProvider.generateToken(PRODUCTION_USERNAME, Role.PRODUCTION.getAuthority(), 3L);
        salesToken = jwtTokenProvider.generateToken(SALES_USERNAME, Role.SALES.getAuthority(), 4L);
    }

    @Nested
    @DisplayName("GET /api/users")
    class ListUsersTests {

        @Test
        @DisplayName("should return 200 with user list for Admin")
        void listUsers_AsAdmin_Returns200WithUsers() throws Exception {
            mockMvc.perform(get(USERS_URL)
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content", hasSize(greaterThanOrEqualTo(1))))
                    .andExpect(jsonPath("$.data.content[0].id").isNumber())
                    .andExpect(jsonPath("$.data.content[0].username").isString())
                    .andExpect(jsonPath("$.data.content[0].passwordHash").doesNotExist()); // Password should not be exposed
        }

        @Test
        @DisplayName("should return 403 for Finance role")
        void listUsers_AsFinance_Returns403() throws Exception {
            mockMvc.perform(get(USERS_URL)
                            .header("Authorization", "Bearer " + financeToken))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 403 for Production role")
        void listUsers_AsProduction_Returns403() throws Exception {
            mockMvc.perform(get(USERS_URL)
                            .header("Authorization", "Bearer " + productionToken))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 403 for Sales role")
        void listUsers_AsSales_Returns403() throws Exception {
            mockMvc.perform(get(USERS_URL)
                            .header("Authorization", "Bearer " + salesToken))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 401 without authentication")
        void listUsers_WithoutAuth_Returns401() throws Exception {
            mockMvc.perform(get(USERS_URL))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("GET /api/users/{id}")
    class GetUserTests {

        @Test
        @DisplayName("should return 200 with user for Admin")
        void getUser_AsAdmin_Returns200WithUser() throws Exception {
            mockMvc.perform(get(USERS_URL + "/1")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").value(1))
                    .andExpect(jsonPath("$.data.username").value(ADMIN_USERNAME))
                    .andExpect(jsonPath("$.data.passwordHash").doesNotExist());
        }

        @Test
        @DisplayName("should return 404 for non-existent user")
        void getUser_NonExistent_Returns404() throws Exception {
            mockMvc.perform(get(USERS_URL + "/999")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("should return 403 for non-Admin role")
        void getUser_AsNonAdmin_Returns403() throws Exception {
            mockMvc.perform(get(USERS_URL + "/1")
                            .header("Authorization", "Bearer " + financeToken))
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("POST /api/users")
    class CreateUserTests {

        @Test
        @DisplayName("should return 201 with created user for Admin")
        void createUser_AsAdmin_Returns201() throws Exception {
            // Given
            String createRequest = """
                    {
                        "username": "newuser",
                        "email": "newuser@wellkorea.com",
                        "password": "securePassword123",
                        "fullName": "New User",
                        "roles": ["SALES"]
                    }
                    """;

            // When & Then
            mockMvc.perform(post(USERS_URL)
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isCreated())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").isNumber())
                    .andExpect(jsonPath("$.data.username").value("newuser"))
                    .andExpect(jsonPath("$.data.email").value("newuser@wellkorea.com"))
                    .andExpect(jsonPath("$.data.passwordHash").doesNotExist());
        }

        @Test
        @DisplayName("should return 400 on duplicate username")
        void createUser_DuplicateUsername_Returns400() throws Exception {
            // Given - Username already exists
            String createRequest = """
                    {
                        "username": "admin",
                        "email": "different@wellkorea.com",
                        "password": "securePassword123",
                        "fullName": "Another Admin",
                        "roles": ["ADMIN"]
                    }
                    """;

            // When & Then
            mockMvc.perform(post(USERS_URL)
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 400 on duplicate email")
        void createUser_DuplicateEmail_Returns400() throws Exception {
            // Given - Email already exists
            String createRequest = """
                    {
                        "username": "differentuser",
                        "email": "admin@wellkorea.com",
                        "password": "securePassword123",
                        "fullName": "Different User",
                        "roles": ["SALES"]
                    }
                    """;

            // When & Then
            mockMvc.perform(post(USERS_URL)
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 400 on missing required fields")
        void createUser_MissingFields_Returns400() throws Exception {
            // Given - Missing username
            String createRequest = """
                    {
                        "email": "newuser@wellkorea.com",
                        "password": "securePassword123"
                    }
                    """;

            // When & Then
            mockMvc.perform(post(USERS_URL)
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 403 for non-Admin role")
        void createUser_AsNonAdmin_Returns403() throws Exception {
            String createRequest = """
                    {
                        "username": "newuser",
                        "email": "newuser@wellkorea.com",
                        "password": "securePassword123",
                        "fullName": "New User",
                        "roles": ["SALES"]
                    }
                    """;

            mockMvc.perform(post(USERS_URL)
                            .header("Authorization", "Bearer " + financeToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("PUT /api/users/{id}")
    class UpdateUserTests {

        @Test
        @DisplayName("should return 200 with updated user for Admin")
        void updateUser_AsAdmin_Returns200() throws Exception {
            // Given
            String updateRequest = """
                    {
                        "fullName": "Updated Admin Name",
                        "email": "updated.admin@wellkorea.com",
                        "isActive": true
                    }
                    """;

            // When & Then
            mockMvc.perform(put(USERS_URL + "/1")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(updateRequest))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.fullName").value("Updated Admin Name"))
                    .andExpect(jsonPath("$.data.email").value("updated.admin@wellkorea.com"));
        }

        @Test
        @DisplayName("should return 404 for non-existent user")
        void updateUser_NonExistent_Returns404() throws Exception {
            String updateRequest = """
                    {
                        "fullName": "Updated Name",
                        "email": "updated@example.com"
                    }
                    """;

            mockMvc.perform(put(USERS_URL + "/999")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(updateRequest))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("should return 403 for non-Admin role")
        void updateUser_AsNonAdmin_Returns403() throws Exception {
            String updateRequest = """
                    {
                        "fullName": "Updated Name",
                        "email": "updated@example.com"
                    }
                    """;

            mockMvc.perform(put(USERS_URL + "/1")
                            .header("Authorization", "Bearer " + financeToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(updateRequest))
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("DELETE /api/users/{id}")
    class DeleteUserTests {

        @Test
        @DisplayName("should return 204 when user deactivated by Admin")
        void deleteUser_AsAdmin_Returns204() throws Exception {
            // Note: This should soft-delete (deactivate) the user, not hard delete
            mockMvc.perform(delete(USERS_URL + "/2")  // Delete finance user
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isNoContent());

            // Verify user is deactivated
            mockMvc.perform(get(USERS_URL + "/2")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.isActive").value(false));
        }

        @Test
        @DisplayName("should return 404 for non-existent user")
        void deleteUser_NonExistent_Returns404() throws Exception {
            mockMvc.perform(delete(USERS_URL + "/999")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("should return 403 for non-Admin role")
        void deleteUser_AsNonAdmin_Returns403() throws Exception {
            mockMvc.perform(delete(USERS_URL + "/2")
                            .header("Authorization", "Bearer " + financeToken))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 400 when Admin tries to delete themselves")
        void deleteUser_AdminSelfDelete_Returns400() throws Exception {
            mockMvc.perform(delete(USERS_URL + "/1")  // Admin is user ID 1
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("PUT /api/users/{id}/roles")
    class AssignRolesTests {

        @Test
        @DisplayName("should return 200 when roles assigned by Admin")
        void assignRoles_AsAdmin_Returns200() throws Exception {
            String rolesRequest = """
                    {
                        "roles": ["ROLE_ADMIN", "ROLE_FINANCE"]
                    }
                    """;

            mockMvc.perform(put(USERS_URL + "/2/roles")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(rolesRequest))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Roles assigned successfully"));
        }

        @Test
        @DisplayName("should return 200 with empty roles")
        void assignRoles_EmptyRoles_Returns200() throws Exception {
            String rolesRequest = """
                    {
                        "roles": []
                    }
                    """;

            mockMvc.perform(put(USERS_URL + "/2/roles")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(rolesRequest))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("should return 400 when roles is null")
        void assignRoles_NullRoles_Returns400() throws Exception {
            String rolesRequest = """
                    {
                    }
                    """;

            mockMvc.perform(put(USERS_URL + "/2/roles")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(rolesRequest))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 403 for non-Admin role")
        void assignRoles_AsNonAdmin_Returns403() throws Exception {
            String rolesRequest = """
                    {
                        "roles": ["ROLE_SALES"]
                    }
                    """;

            mockMvc.perform(put(USERS_URL + "/2/roles")
                            .header("Authorization", "Bearer " + financeToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(rolesRequest))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 401 without authentication")
        void assignRoles_WithoutAuth_Returns401() throws Exception {
            String rolesRequest = """
                    {
                        "roles": ["ROLE_SALES"]
                    }
                    """;

            mockMvc.perform(put(USERS_URL + "/2/roles")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(rolesRequest))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("POST /api/users/{id}/activate")
    class ActivateUserTests {

        @Test
        @DisplayName("should return 200 when user activated by Admin")
        void activateUser_AsAdmin_Returns200() throws Exception {
            // First deactivate the user
            mockMvc.perform(delete(USERS_URL + "/2")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isNoContent());

            // Then activate the user
            mockMvc.perform(post(USERS_URL + "/2/activate")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("User activated successfully"));

            // Verify user is active
            mockMvc.perform(get(USERS_URL + "/2")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.isActive").value(true));
        }

        @Test
        @DisplayName("should return 403 for non-Admin role")
        void activateUser_AsNonAdmin_Returns403() throws Exception {
            mockMvc.perform(post(USERS_URL + "/2/activate")
                            .header("Authorization", "Bearer " + financeToken))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 401 without authentication")
        void activateUser_WithoutAuth_Returns401() throws Exception {
            mockMvc.perform(post(USERS_URL + "/2/activate"))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("PUT /api/users/{id}/password")
    class ChangePasswordTests {

        @Test
        @DisplayName("should return 200 when password changed by Admin")
        void changePassword_AsAdmin_Returns200() throws Exception {
            String passwordRequest = """
                    {
                        "newPassword": "newSecurePassword123"
                    }
                    """;

            mockMvc.perform(put(USERS_URL + "/2/password")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(passwordRequest))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Password changed successfully"));
        }

        @Test
        @DisplayName("should return 400 when password is too short")
        void changePassword_TooShort_Returns400() throws Exception {
            String passwordRequest = """
                    {
                        "newPassword": "short"
                    }
                    """;

            mockMvc.perform(put(USERS_URL + "/2/password")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(passwordRequest))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 400 when password is missing")
        void changePassword_MissingPassword_Returns400() throws Exception {
            String passwordRequest = """
                    {
                    }
                    """;

            mockMvc.perform(put(USERS_URL + "/2/password")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(passwordRequest))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 403 for non-Admin role")
        void changePassword_AsNonAdmin_Returns403() throws Exception {
            String passwordRequest = """
                    {
                        "newPassword": "newSecurePassword123"
                    }
                    """;

            mockMvc.perform(put(USERS_URL + "/2/password")
                            .header("Authorization", "Bearer " + financeToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(passwordRequest))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 401 without authentication")
        void changePassword_WithoutAuth_Returns401() throws Exception {
            String passwordRequest = """
                    {
                        "newPassword": "newSecurePassword123"
                    }
                    """;

            mockMvc.perform(put(USERS_URL + "/2/password")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(passwordRequest))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("GET /api/users/{id}/customers")
    class GetUserCustomersTests {

        @Test
        @DisplayName("should return 200 with customer IDs for Admin")
        void getUserCustomers_AsAdmin_Returns200() throws Exception {
            mockMvc.perform(get(USERS_URL + "/2/customers")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.customerIds").isArray());
        }

        @Test
        @DisplayName("should return 403 for non-Admin role")
        void getUserCustomers_AsNonAdmin_Returns403() throws Exception {
            mockMvc.perform(get(USERS_URL + "/2/customers")
                            .header("Authorization", "Bearer " + financeToken))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 401 without authentication")
        void getUserCustomers_WithoutAuth_Returns401() throws Exception {
            mockMvc.perform(get(USERS_URL + "/2/customers"))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("PUT /api/users/{id}/customers")
    class AssignCustomersTests {

        @Test
        @DisplayName("should return 200 when customers assigned by Admin")
        void assignCustomers_AsAdmin_Returns200() throws Exception {
            String customersRequest = """
                    {
                        "customerIds": [1, 2, 3]
                    }
                    """;

            mockMvc.perform(put(USERS_URL + "/2/customers")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(customersRequest))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Customer assignments updated successfully"));
        }

        @Test
        @DisplayName("should return 200 with empty customer list")
        void assignCustomers_EmptyList_Returns200() throws Exception {
            String customersRequest = """
                    {
                        "customerIds": []
                    }
                    """;

            mockMvc.perform(put(USERS_URL + "/2/customers")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(customersRequest))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("should return 400 when customerIds is null")
        void assignCustomers_NullCustomerIds_Returns400() throws Exception {
            String customersRequest = """
                    {
                    }
                    """;

            mockMvc.perform(put(USERS_URL + "/2/customers")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(customersRequest))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 403 for non-Admin role")
        void assignCustomers_AsNonAdmin_Returns403() throws Exception {
            String customersRequest = """
                    {
                        "customerIds": [1, 2]
                    }
                    """;

            mockMvc.perform(put(USERS_URL + "/2/customers")
                            .header("Authorization", "Bearer " + financeToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(customersRequest))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 401 without authentication")
        void assignCustomers_WithoutAuth_Returns401() throws Exception {
            String customersRequest = """
                    {
                        "customerIds": [1, 2]
                    }
                    """;

            mockMvc.perform(put(USERS_URL + "/2/customers")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(customersRequest))
                    .andExpect(status().isUnauthorized());
        }
    }
}
