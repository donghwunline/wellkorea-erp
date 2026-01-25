package com.wellkorea.backend.auth.api;

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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Contract tests for /api/audit endpoints.
 * Tests validate the audit log query API contract (Admin only).
 * <p>
 * Test-First Development: These tests MUST be written FIRST and MUST FAIL initially.
 * Per Constitution Principle I (Test-First Development).
 * <p>
 * T035: GET /api/audit - Admin only
 */
@Tag("integration")
@AutoConfigureMockMvc
@Transactional
@DisplayName("Audit Log Controller Contract Tests")
class AuditLogControllerTest extends BaseIntegrationTest implements TestFixtures {

    private static final String AUDIT_URL = "/api/audit";

    @Autowired
    private MockMvc mockMvc;

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

        // Insert some audit log entries (the trigger auto-logs user insertions)
        // Additional manual audit entry for testing queries
        jdbcTemplate.update("""
                        INSERT INTO audit_logs (entity_type, entity_id, action, user_id, username, changes)
                        VALUES (?, ?, ?, ?, ?, ?::jsonb)
                        """,
                "Project", 1L, "CREATE", 1L, ADMIN_USERNAME,
                "{\"new\": {\"id\": 1, \"job_code\": \"WK22025-000001-20251211\"}}");
    }

    @Nested
    @DisplayName("GET /api/audit")
    class ListAuditLogsTests {

        @Test
        @DisplayName("should return 200 with audit log list for Admin")
        void listAuditLogs_AsAdmin_Returns200() throws Exception {
            mockMvc.perform(get(AUDIT_URL)
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content", hasSize(greaterThanOrEqualTo(1))))
                    .andExpect(jsonPath("$.data.content[0].id").isNumber())
                    .andExpect(jsonPath("$.data.content[0].entityType").isString())
                    .andExpect(jsonPath("$.data.content[0].action").isString())
                    .andExpect(jsonPath("$.data.content[0].createdAt").isString());
        }

        @Test
        @DisplayName("should return 403 for Finance role")
        void listAuditLogs_AsFinance_Returns403() throws Exception {
            mockMvc.perform(get(AUDIT_URL)
                            .header("Authorization", "Bearer " + financeToken))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 403 for Production role")
        void listAuditLogs_AsProduction_Returns403() throws Exception {
            mockMvc.perform(get(AUDIT_URL)
                            .header("Authorization", "Bearer " + productionToken))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 403 for Sales role")
        void listAuditLogs_AsSales_Returns403() throws Exception {
            mockMvc.perform(get(AUDIT_URL)
                            .header("Authorization", "Bearer " + salesToken))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 401 without authentication")
        void listAuditLogs_WithoutAuth_Returns401() throws Exception {
            mockMvc.perform(get(AUDIT_URL))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("GET /api/audit with filters")
    class FilterAuditLogsTests {

        @Test
        @DisplayName("should filter by entity type")
        void listAuditLogs_FilterByEntityType_ReturnsFiltered() throws Exception {
            mockMvc.perform(get(AUDIT_URL)
                            .param("entityType", "Project")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content[0].entityType").value("Project"));
        }

        @Test
        @DisplayName("should filter by action")
        void listAuditLogs_FilterByAction_ReturnsFiltered() throws Exception {
            mockMvc.perform(get(AUDIT_URL)
                            .param("action", "CREATE")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content[0].action").value("CREATE"));
        }

        @Test
        @DisplayName("should filter by user ID")
        void listAuditLogs_FilterByUserId_ReturnsFiltered() throws Exception {
            mockMvc.perform(get(AUDIT_URL)
                            .param("userId", "1")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }

        @Test
        @DisplayName("should filter by entity ID")
        void listAuditLogs_FilterByEntityId_ReturnsFiltered() throws Exception {
            mockMvc.perform(get(AUDIT_URL)
                            .param("entityType", "Project")
                            .param("entityId", "1")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content[0].entityId").value(1));
        }

        @Test
        @DisplayName("should support pagination")
        void listAuditLogs_WithPagination_ReturnsPaginated() throws Exception {
            mockMvc.perform(get(AUDIT_URL)
                            .param("page", "0")
                            .param("size", "10")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.metadata.page").value(0))
                    .andExpect(jsonPath("$.metadata.size").value(10));
        }
    }

    @Nested
    @DisplayName("GET /api/audit/{id}")
    class GetAuditLogTests {

        @Test
        @DisplayName("should return 200 with audit log entry for Admin")
        void getAuditLog_AsAdmin_Returns200() throws Exception {
            // First get the list to find an existing ID
            Long auditLogId = jdbcTemplate.queryForObject(
                    "SELECT id FROM audit_logs LIMIT 1",
                    Long.class
            );

            mockMvc.perform(get(AUDIT_URL + "/" + auditLogId)
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").value(auditLogId.intValue()))
                    .andExpect(jsonPath("$.data.entityType").isString())
                    .andExpect(jsonPath("$.data.action").isString());
        }

        @Test
        @DisplayName("should return 404 for non-existent audit log")
        void getAuditLog_NonExistent_Returns404() throws Exception {
            mockMvc.perform(get(AUDIT_URL + "/999999")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("should return 403 for non-Admin role")
        void getAuditLog_AsNonAdmin_Returns403() throws Exception {
            Long auditLogId = jdbcTemplate.queryForObject(
                    "SELECT id FROM audit_logs LIMIT 1",
                    Long.class
            );

            mockMvc.perform(get(AUDIT_URL + "/" + auditLogId)
                            .header("Authorization", "Bearer " + financeToken))
                    .andExpect(status().isForbidden());
        }
    }
}
