package com.wellkorea.backend.production.api;

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

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Contract tests for /api/work-progress endpoints.
 * Tests validate the WorkProgress domain API contract with RBAC.
 * <p>
 * Test-First Development: These tests MUST be written FIRST and MUST FAIL initially.
 * Per Constitution Principle I (Test-First Development).
 * <p>
 * RBAC Rules:
 * - Production: Full CRUD access (primary users)
 * - Admin, Finance: Full read access, limited write access
 * - Sales: Read-only access (view production status)
 */
@Tag("integration")
@AutoConfigureMockMvc
@Transactional
@DisplayName("WorkProgress Controller Contract Tests")
class WorkProgressControllerTest extends BaseIntegrationTest implements TestFixtures {

    private static final String WORK_PROGRESS_URL = "/api/work-progress";

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
    private String salesToken;
    private String productionToken;

    @BeforeEach
    void setUp() {
        DatabaseTestHelper.insertTestUsersWithRoles(jdbcTemplate);
        DatabaseTestHelper.insertTestCustomer(jdbcTemplate);
        DatabaseTestHelper.insertTestProducts(jdbcTemplate);

        // Generate tokens for different roles
        adminToken = jwtTokenProvider.generateToken(ADMIN_USERNAME, Role.ADMIN.getAuthority(), TEST_USER_ID);
        financeToken = jwtTokenProvider.generateToken(FINANCE_USERNAME, Role.FINANCE.getAuthority(), 2L);
        salesToken = jwtTokenProvider.generateToken(SALES_USERNAME, Role.SALES.getAuthority(), 4L);
        productionToken = jwtTokenProvider.generateToken(PRODUCTION_USERNAME, Role.PRODUCTION.getAuthority(), 3L);

        // Insert a test project for work progress tests
        insertTestProject();
    }

    private void insertTestProject() {
        jdbcTemplate.update(
                "INSERT INTO projects (id, job_code, customer_company_id, project_name, due_date, " +
                        "internal_owner_id, status, created_by_id, created_at, updated_at) " +
                        "VALUES (1, 'WK2K25-0001-0105', 1, 'Test Project', '2025-02-28', " +
                        "1, 'ACTIVE', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) " +
                        "ON CONFLICT (id) DO NOTHING"
        );
        jdbcTemplate.execute("SELECT setval('projects_id_seq', (SELECT COALESCE(MAX(id), 0) FROM projects))");
    }

    private void insertTestWorkProgressSheet() {
        // Insert a work progress sheet
        jdbcTemplate.update(
                "INSERT INTO work_progress_sheets (id, project_id, product_id, quantity, sequence, status) " +
                        "VALUES (1, 1, 1, 10, 1, 'NOT_STARTED') " +
                        "ON CONFLICT DO NOTHING"
        );
        jdbcTemplate.execute("SELECT setval('work_progress_sheets_id_seq', (SELECT COALESCE(MAX(id), 0) FROM work_progress_sheets))");

        // Insert work progress steps from templates
        jdbcTemplate.update(
                "INSERT INTO work_progress_steps (id, sheet_id, step_template_id, step_number, step_name, status, estimated_hours) " +
                        "SELECT nextval('work_progress_steps_id_seq'), 1, t.id, t.step_number, t.step_name, 'NOT_STARTED', t.estimated_hours " +
                        "FROM work_progress_step_templates t " +
                        "WHERE t.product_type_id = 1 " +
                        "ON CONFLICT DO NOTHING"
        );
    }

    // ==========================================================================
    // POST /api/work-progress - Create Work Progress Sheet
    // ==========================================================================

    @Nested
    @DisplayName("POST /api/work-progress - Create Work Progress Sheet")
    class CreateWorkProgressSheetTests {

        @Test
        @DisplayName("should return 201 with command result when Production creates work progress sheet")
        void createWorkProgressSheet_AsProduction_Returns201() throws Exception {
            String createRequest = """
                    {
                        "projectId": 1,
                        "productId": 1,
                        "quantity": 10,
                        "sequence": 1
                    }
                    """;

            mockMvc.perform(post(WORK_PROGRESS_URL)
                            .header("Authorization", "Bearer " + productionToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isCreated())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").isNumber())
                    .andExpect(jsonPath("$.data.message").value("Work progress sheet created successfully"));
        }

        @Test
        @DisplayName("should return 201 when Admin creates work progress sheet")
        void createWorkProgressSheet_AsAdmin_Returns201() throws Exception {
            String createRequest = """
                    {
                        "projectId": 1,
                        "productId": 2,
                        "quantity": 5
                    }
                    """;

            mockMvc.perform(post(WORK_PROGRESS_URL)
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true));
        }

        @Test
        @DisplayName("should return 403 when Sales creates work progress sheet")
        void createWorkProgressSheet_AsSales_Returns403() throws Exception {
            String createRequest = """
                    {
                        "projectId": 1,
                        "productId": 1,
                        "quantity": 10
                    }
                    """;

            mockMvc.perform(post(WORK_PROGRESS_URL)
                            .header("Authorization", "Bearer " + salesToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 400 when project does not exist")
        void createWorkProgressSheet_NonExistentProject_Returns400() throws Exception {
            String createRequest = """
                    {
                        "projectId": 999,
                        "productId": 1,
                        "quantity": 10
                    }
                    """;

            mockMvc.perform(post(WORK_PROGRESS_URL)
                            .header("Authorization", "Bearer " + productionToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 400 when product does not exist")
        void createWorkProgressSheet_NonExistentProduct_Returns400() throws Exception {
            String createRequest = """
                    {
                        "projectId": 1,
                        "productId": 999,
                        "quantity": 10
                    }
                    """;

            mockMvc.perform(post(WORK_PROGRESS_URL)
                            .header("Authorization", "Bearer " + productionToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 409 when duplicate project-product combination")
        void createWorkProgressSheet_DuplicateProjectProduct_Returns409() throws Exception {
            insertTestWorkProgressSheet();

            String createRequest = """
                    {
                        "projectId": 1,
                        "productId": 1,
                        "quantity": 10
                    }
                    """;

            mockMvc.perform(post(WORK_PROGRESS_URL)
                            .header("Authorization", "Bearer " + productionToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isConflict());
        }
    }

    // ==========================================================================
    // GET /api/work-progress - List Work Progress Sheets
    // ==========================================================================

    @Nested
    @DisplayName("GET /api/work-progress - List Work Progress Sheets")
    class GetWorkProgressSheetsTests {

        @Test
        @DisplayName("should return 200 with list when Production lists work progress sheets")
        void getWorkProgressSheets_AsProduction_Returns200() throws Exception {
            insertTestWorkProgressSheet();

            mockMvc.perform(get(WORK_PROGRESS_URL)
                            .header("Authorization", "Bearer " + productionToken)
                            .param("projectId", "1"))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))))
                    .andExpect(jsonPath("$.data[0].id").isNumber())
                    .andExpect(jsonPath("$.data[0].projectId").value(1))
                    .andExpect(jsonPath("$.data[0].productId").value(1))
                    .andExpect(jsonPath("$.data[0].status").value("NOT_STARTED"));
        }

        @Test
        @DisplayName("should return 200 with aggregated progress percentage")
        void getWorkProgressSheets_WithProgress_Returns200() throws Exception {
            insertTestWorkProgressSheet();

            mockMvc.perform(get(WORK_PROGRESS_URL)
                            .header("Authorization", "Bearer " + productionToken)
                            .param("projectId", "1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data[0].progressPercentage").exists());
        }

        @Test
        @DisplayName("should return 200 when Sales views work progress (read-only)")
        void getWorkProgressSheets_AsSales_Returns200() throws Exception {
            insertTestWorkProgressSheet();

            mockMvc.perform(get(WORK_PROGRESS_URL)
                            .header("Authorization", "Bearer " + salesToken)
                            .param("projectId", "1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }
    }

    // ==========================================================================
    // GET /api/work-progress/{id} - Get Work Progress Sheet Detail
    // ==========================================================================

    @Nested
    @DisplayName("GET /api/work-progress/{id} - Get Work Progress Sheet Detail")
    class GetWorkProgressSheetDetailTests {

        @Test
        @DisplayName("should return 200 with sheet and steps when Production gets detail")
        void getWorkProgressSheetDetail_AsProduction_Returns200() throws Exception {
            insertTestWorkProgressSheet();

            mockMvc.perform(get(WORK_PROGRESS_URL + "/1")
                            .header("Authorization", "Bearer " + productionToken))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").value(1))
                    .andExpect(jsonPath("$.data.projectId").value(1))
                    .andExpect(jsonPath("$.data.productId").value(1))
                    .andExpect(jsonPath("$.data.status").value("NOT_STARTED"))
                    .andExpect(jsonPath("$.data.steps").isArray())
                    .andExpect(jsonPath("$.data.steps", hasSize(greaterThanOrEqualTo(1))));
        }

        @Test
        @DisplayName("should return 404 when sheet does not exist")
        void getWorkProgressSheetDetail_NonExistent_Returns404() throws Exception {
            mockMvc.perform(get(WORK_PROGRESS_URL + "/999")
                            .header("Authorization", "Bearer " + productionToken))
                    .andExpect(status().isNotFound());
        }
    }

    // ==========================================================================
    // PUT /api/work-progress/{id}/steps/{stepId} - Update Step Status
    // ==========================================================================

    @Nested
    @DisplayName("PUT /api/work-progress/{id}/steps/{stepId} - Update Step Status")
    class UpdateStepStatusTests {

        @Test
        @DisplayName("should return 200 when Production updates step status to IN_PROGRESS")
        void updateStepStatus_ToInProgress_Returns200() throws Exception {
            insertTestWorkProgressSheet();

            // Get the first step ID
            Long stepId = jdbcTemplate.queryForObject(
                    "SELECT id FROM work_progress_steps WHERE sheet_id = 1 ORDER BY step_number LIMIT 1",
                    Long.class
            );

            String updateRequest = """
                    {
                        "status": "IN_PROGRESS",
                        "notes": "Started work on this step"
                    }
                    """;

            mockMvc.perform(put(WORK_PROGRESS_URL + "/1/steps/" + stepId)
                            .header("Authorization", "Bearer " + productionToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(updateRequest))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").value(stepId))
                    .andExpect(jsonPath("$.data.message").value("Step updated successfully"));
        }

        @Test
        @DisplayName("should return 200 when Production completes step with completed_by")
        void updateStepStatus_ToCompleted_Returns200() throws Exception {
            insertTestWorkProgressSheet();

            Long stepId = jdbcTemplate.queryForObject(
                    "SELECT id FROM work_progress_steps WHERE sheet_id = 1 ORDER BY step_number LIMIT 1",
                    Long.class
            );

            String updateRequest = """
                    {
                        "status": "COMPLETED",
                        "actualHours": 2.5,
                        "notes": "Completed successfully"
                    }
                    """;

            mockMvc.perform(put(WORK_PROGRESS_URL + "/1/steps/" + stepId)
                            .header("Authorization", "Bearer " + productionToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(updateRequest))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").value(stepId))
                    .andExpect(jsonPath("$.data.message").value("Step updated successfully"));
        }

        @Test
        @DisplayName("should return 200 when marking step as outsourced")
        void updateStepStatus_Outsourced_Returns200() throws Exception {
            insertTestWorkProgressSheet();

            // Insert an outsource vendor
            jdbcTemplate.update(
                    "INSERT INTO companies (id, name, is_active) VALUES (100, 'Outsource Vendor', true) " +
                            "ON CONFLICT (id) DO NOTHING"
            );
            jdbcTemplate.update(
                    "INSERT INTO company_roles (company_id, role_type) VALUES (100, 'OUTSOURCE') " +
                            "ON CONFLICT (company_id, role_type) DO NOTHING"
            );

            Long stepId = jdbcTemplate.queryForObject(
                    "SELECT id FROM work_progress_steps WHERE sheet_id = 1 ORDER BY step_number LIMIT 1",
                    Long.class
            );

            String updateRequest = """
                    {
                        "status": "IN_PROGRESS",
                        "isOutsourced": true,
                        "outsourceVendorId": 100,
                        "outsourceEta": "2025-01-15",
                        "outsourceCost": 50000.00,
                        "notes": "Sent to vendor for processing"
                    }
                    """;

            mockMvc.perform(put(WORK_PROGRESS_URL + "/1/steps/" + stepId)
                            .header("Authorization", "Bearer " + productionToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(updateRequest))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").value(stepId))
                    .andExpect(jsonPath("$.data.message").value("Step updated successfully"));
        }

        @Test
        @DisplayName("should return 403 when Sales updates step status")
        void updateStepStatus_AsSales_Returns403() throws Exception {
            insertTestWorkProgressSheet();

            Long stepId = jdbcTemplate.queryForObject(
                    "SELECT id FROM work_progress_steps WHERE sheet_id = 1 ORDER BY step_number LIMIT 1",
                    Long.class
            );

            String updateRequest = """
                    {
                        "status": "IN_PROGRESS"
                    }
                    """;

            mockMvc.perform(put(WORK_PROGRESS_URL + "/1/steps/" + stepId)
                            .header("Authorization", "Bearer " + salesToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(updateRequest))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 404 when step does not exist")
        void updateStepStatus_NonExistentStep_Returns404() throws Exception {
            insertTestWorkProgressSheet();

            String updateRequest = """
                    {
                        "status": "IN_PROGRESS"
                    }
                    """;

            mockMvc.perform(put(WORK_PROGRESS_URL + "/1/steps/999")
                            .header("Authorization", "Bearer " + productionToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(updateRequest))
                    .andExpect(status().isNotFound());
        }
    }

    // ==========================================================================
    // GET /api/work-progress/project/{projectId}/summary - Project Production Summary
    // ==========================================================================

    @Nested
    @DisplayName("GET /api/work-progress/project/{projectId}/summary - Project Production Summary")
    class GetProjectProductionSummaryTests {

        @Test
        @DisplayName("should return 200 with aggregated progress for all products")
        void getProjectSummary_Returns200() throws Exception {
            insertTestWorkProgressSheet();

            mockMvc.perform(get(WORK_PROGRESS_URL + "/project/1/summary")
                            .header("Authorization", "Bearer " + productionToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.projectId").value(1))
                    .andExpect(jsonPath("$.data.totalSheets").isNumber())
                    .andExpect(jsonPath("$.data.completedSheets").isNumber())
                    .andExpect(jsonPath("$.data.overallProgressPercentage").isNumber());
        }

        @Test
        @DisplayName("should return 200 with empty summary when no sheets exist")
        void getProjectSummary_NoSheets_Returns200() throws Exception {
            mockMvc.perform(get(WORK_PROGRESS_URL + "/project/1/summary")
                            .header("Authorization", "Bearer " + productionToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.totalSheets").value(0))
                    .andExpect(jsonPath("$.data.overallProgressPercentage").value(0));
        }
    }
}
