package com.wellkorea.backend.auth;

import com.wellkorea.backend.BaseIntegrationTest;
import com.wellkorea.backend.auth.domain.vo.Role;
import com.wellkorea.backend.auth.infrastructure.config.JwtTokenProvider;
import com.wellkorea.backend.shared.test.TestFixtures;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration tests for Role-Based Access Control (RBAC) enforcement.
 * Tests that different roles have appropriate access to protected resources.
 * <p>
 * Security Requirements:
 * - ADMIN: Full system access
 * - FINANCE: Access to quotations, invoices, AR/AP
 * - SALES: Read access to own quotations
 * - PRODUCTION: Can update work progress, CANNOT access quotations or pricing data
 * <p>
 * Test-First: Per Constitution Principle I, this test is written FIRST and MUST FAIL
 * until quotation endpoints with role-based security are implemented.
 */
@Tag("integration")
@AutoConfigureMockMvc
@DisplayName("RBAC Integration Tests")
class RBACIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private String adminToken;
    private String financeToken;
    private String salesToken;
    private String productionToken;

    @BeforeEach
    void setUp() {
        // Generate tokens for each role (userId is required for approval workflows)
        adminToken = jwtTokenProvider.generateToken(TestFixtures.ADMIN_USERNAME, Role.ADMIN.getAuthority(), TestFixtures.TEST_USER_ID);
        financeToken = jwtTokenProvider.generateToken(TestFixtures.FINANCE_USERNAME, Role.FINANCE.getAuthority(), 2L);
        salesToken = jwtTokenProvider.generateToken(TestFixtures.SALES_USERNAME, Role.SALES.getAuthority(), 4L);
        productionToken = jwtTokenProvider.generateToken(TestFixtures.PRODUCTION_USERNAME, Role.PRODUCTION.getAuthority(), 3L);
    }

    @Nested
    @Disabled("enable after implementing /quotations endpoints")
    @DisplayName("Quotation Access Control")
    class QuotationAccessControl {

        /**
         * Production users should NOT be able to access quotations.
         * This is a critical security requirement: Production staff cannot see pricing data.
         * <p>
         * Expected: 403 Forbidden when Production user tries to access /api/quotations
         * <p>
         * NOTE: This test will FAIL initially because /api/quotations endpoint
         * with @PreAuthorize security is not yet implemented (Phase 5/US2).
         * Per Constitution Principle I (Test-First), this is expected behavior.
         */
        @Test
        @DisplayName("Production role CANNOT access quotations - expects 403 Forbidden")
        void productionUserCannotAccessQuotations() throws Exception {
            mockMvc.perform(get("/api/quotations")
                            .header("Authorization", "Bearer " + productionToken))
                    .andExpect(status().isForbidden());
        }

        /**
         * Finance users SHOULD have access to all quotations.
         */
        @Test
        @DisplayName("Finance role CAN access quotations - expects 200 OK")
        void financeUserCanAccessQuotations() throws Exception {
            mockMvc.perform(get("/api/quotations")
                            .header("Authorization", "Bearer " + financeToken))
                    .andExpect(status().isOk());
        }

        /**
         * Admin users SHOULD have access to all quotations.
         */
        @Test
        @DisplayName("Admin role CAN access quotations - expects 200 OK")
        void adminUserCanAccessQuotations() throws Exception {
            mockMvc.perform(get("/api/quotations")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk());
        }

        /**
         * Sales users SHOULD have read access to quotations.
         * (Full implementation will filter to show only their own quotations)
         */
        @Test
        @DisplayName("Sales role CAN access quotations - expects 200 OK")
        void salesUserCanAccessQuotations() throws Exception {
            mockMvc.perform(get("/api/quotations")
                            .header("Authorization", "Bearer " + salesToken))
                    .andExpect(status().isOk());
        }
    }

    @Nested
    @Disabled("enable after implementing /invoices endpoints")
    @DisplayName("Invoice Access Control")
    class InvoiceAccessControl {

        /**
         * Production users should NOT be able to access invoices.
         */
        @Test
        @DisplayName("Production role CANNOT access invoices - expects 403 Forbidden")
        void productionUserCannotAccessInvoices() throws Exception {
            mockMvc.perform(get("/api/invoices")
                            .header("Authorization", "Bearer " + productionToken))
                    .andExpect(status().isForbidden());
        }

        /**
         * Sales users should NOT be able to access invoices.
         */
        @Test
        @DisplayName("Sales role CANNOT access invoices - expects 403 Forbidden")
        void salesUserCannotAccessInvoices() throws Exception {
            mockMvc.perform(get("/api/invoices")
                            .header("Authorization", "Bearer " + salesToken))
                    .andExpect(status().isForbidden());
        }

        /**
         * Finance users SHOULD have access to all invoices.
         */
        @Test
        @DisplayName("Finance role CAN access invoices - expects 200 OK")
        void financeUserCanAccessInvoices() throws Exception {
            mockMvc.perform(get("/api/invoices")
                            .header("Authorization", "Bearer " + financeToken))
                    .andExpect(status().isOk());
        }

        /**
         * Admin users SHOULD have access to all invoices.
         */
        @Test
        @DisplayName("Admin role CAN access invoices - expects 200 OK")
        void adminUserCanAccessInvoices() throws Exception {
            mockMvc.perform(get("/api/invoices")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk());
        }
    }

    @Nested
    @Disabled("enable after implementing /reports endpoints")
    @DisplayName("AR/AP Report Access Control")
    class ARAPAccessControl {

        /**
         * Production users should NOT be able to access AR/AP reports.
         */
        @Test
        @DisplayName("Production role CANNOT access AR report - expects 403 Forbidden")
        void productionUserCannotAccessARReport() throws Exception {
            mockMvc.perform(get("/api/reports/ar")
                            .header("Authorization", "Bearer " + productionToken))
                    .andExpect(status().isForbidden());
        }

        /**
         * Sales users should NOT be able to access AR/AP reports.
         */
        @Test
        @DisplayName("Sales role CANNOT access AR report - expects 403 Forbidden")
        void salesUserCannotAccessARReport() throws Exception {
            mockMvc.perform(get("/api/reports/ar")
                            .header("Authorization", "Bearer " + salesToken))
                    .andExpect(status().isForbidden());
        }

        /**
         * Finance users SHOULD have access to AR/AP reports.
         */
        @Test
        @DisplayName("Finance role CAN access AR report - expects 200 OK")
        void financeUserCanAccessARReport() throws Exception {
            mockMvc.perform(get("/api/reports/ar")
                            .header("Authorization", "Bearer " + financeToken))
                    .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("User Management Access Control")
    class UserManagementAccessControl {

        /**
         * Only Admin users can access user management endpoints.
         */
        @Test
        @DisplayName("Production role CANNOT access user management - expects 403 Forbidden")
        void productionUserCannotAccessUserManagement() throws Exception {
            mockMvc.perform(get("/api/users")
                            .header("Authorization", "Bearer " + productionToken))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("Sales role CANNOT access user management - expects 403 Forbidden")
        void salesUserCannotAccessUserManagement() throws Exception {
            mockMvc.perform(get("/api/users")
                            .header("Authorization", "Bearer " + salesToken))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("Finance role CANNOT access user management - expects 403 Forbidden")
        void financeUserCannotAccessUserManagement() throws Exception {
            mockMvc.perform(get("/api/users")
                            .header("Authorization", "Bearer " + financeToken))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("Admin role CAN access user management - expects 200 OK")
        void adminUserCanAccessUserManagement() throws Exception {
            mockMvc.perform(get("/api/users")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("Audit Log Access Control")
    class AuditLogAccessControl {

        /**
         * Only Admin users can access audit logs.
         */
        @Test
        @DisplayName("Production role CANNOT access audit logs - expects 403 Forbidden")
        void productionUserCannotAccessAuditLogs() throws Exception {
            mockMvc.perform(get("/api/audit")
                            .header("Authorization", "Bearer " + productionToken))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("Sales role CANNOT access audit logs - expects 403 Forbidden")
        void salesUserCannotAccessAuditLogs() throws Exception {
            mockMvc.perform(get("/api/audit")
                            .header("Authorization", "Bearer " + salesToken))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("Finance role CANNOT access audit logs - expects 403 Forbidden")
        void financeUserCannotAccessAuditLogs() throws Exception {
            mockMvc.perform(get("/api/audit")
                            .header("Authorization", "Bearer " + financeToken))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("Admin role CAN access audit logs - expects 200 OK")
        void adminUserCanAccessAuditLogs() throws Exception {
            mockMvc.perform(get("/api/audit")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("Project Access Control (All Roles)")
    class ProjectAccessControl {

        /**
         * All authenticated users should be able to access projects.
         * Projects are accessible to all roles (core entity).
         */
        @Test
        @DisplayName("Production role CAN access projects - expects 200 OK")
        void productionUserCanAccessProjects() throws Exception {
            mockMvc.perform(get("/api/projects")
                            .header("Authorization", "Bearer " + productionToken))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("Sales role CAN access projects - expects 200 OK")
        void salesUserCanAccessProjects() throws Exception {
            mockMvc.perform(get("/api/projects")
                            .header("Authorization", "Bearer " + salesToken))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("Finance role CAN access projects - expects 200 OK")
        void financeUserCanAccessProjects() throws Exception {
            mockMvc.perform(get("/api/projects")
                            .header("Authorization", "Bearer " + financeToken))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("Admin role CAN access projects - expects 200 OK")
        void adminUserCanAccessProjects() throws Exception {
            mockMvc.perform(get("/api/projects")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk());
        }
    }
}
