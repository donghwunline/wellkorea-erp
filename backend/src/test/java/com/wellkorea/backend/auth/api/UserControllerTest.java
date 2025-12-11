package com.wellkorea.backend.auth.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wellkorea.backend.BaseIntegrationTest;
import com.wellkorea.backend.auth.domain.Role;
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

        // Generate tokens for different roles
        adminToken = jwtTokenProvider.generateToken(ADMIN_USERNAME, Role.ADMIN.getAuthority());
        financeToken = jwtTokenProvider.generateToken(FINANCE_USERNAME, Role.FINANCE.getAuthority());
        productionToken = jwtTokenProvider.generateToken(PRODUCTION_USERNAME, Role.PRODUCTION.getAuthority());
        salesToken = jwtTokenProvider.generateToken(SALES_USERNAME, Role.SALES.getAuthority());
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
                        "fullName": "Updated Name"
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
                        "fullName": "Updated Name"
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
}
