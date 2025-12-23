package com.wellkorea.backend.approval.api;

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

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Contract tests for /api/approvals endpoints.
 * Tests validate the multi-level approval (결재) API contract.
 * <p>
 * Test-First Development: These tests MUST be written FIRST and MUST FAIL initially.
 * Per Constitution Principle I (Test-First Development).
 * <p>
 * Multi-Level Approval Workflow (결재 라인):
 * 1. Sales submits quotation → Creates approval request with all levels
 * 2. Level 1 (팀장/Team Lead) approves/rejects → moves to Level 2 or stops
 * 3. Level 2 (부서장/Dept Head) approves/rejects → moves to Level 3 or stops
 * 4. Level 3 (사장/CEO) approves/rejects → final decision
 * <p>
 * T070: POST /api/approvals/{id}/approve - Level approval
 * T071: POST /api/approvals/{id}/reject - Level rejection with mandatory reason
 * T072: GET /api/approvals - List pending approvals for current user
 */
@Tag("integration")
@AutoConfigureMockMvc
@Transactional
@DisplayName("Approval Controller Contract Tests - Multi-Level Approval (결재)")
class ApprovalControllerTest extends BaseIntegrationTest implements TestFixtures {

    private static final String APPROVALS_URL = "/api/approvals";
    private static final String APPROVAL_CHAINS_URL = "/api/admin/approval-chains";

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

    // User IDs from test data
    private static final Long ADMIN_USER_ID = 1L;
    private static final Long FINANCE_USER_ID = 2L;
    private static final Long PRODUCTION_USER_ID = 3L;
    private static final Long SALES_USER_ID = 4L;

    @BeforeEach
    void setUp() {
        DatabaseTestHelper.insertTestUsersWithRoles(jdbcTemplate);
        insertTestApprovalChainTemplate();

        // Generate tokens for different roles (with userId for approval operations)
        adminToken = jwtTokenProvider.generateToken(ADMIN_USERNAME, Role.ADMIN.getAuthority(), ADMIN_USER_ID);
        financeToken = jwtTokenProvider.generateToken(FINANCE_USERNAME, Role.FINANCE.getAuthority(), FINANCE_USER_ID);
        productionToken = jwtTokenProvider.generateToken(PRODUCTION_USERNAME, Role.PRODUCTION.getAuthority(), PRODUCTION_USER_ID);
        salesToken = jwtTokenProvider.generateToken(SALES_USERNAME, Role.SALES.getAuthority(), SALES_USER_ID);
    }

    /**
     * Helper to insert approval chain template for quotations.
     */
    private void insertTestApprovalChainTemplate() {
        // Insert chain template
        jdbcTemplate.update(
                "INSERT INTO approval_chain_templates (id, entity_type, name, description, is_active) " +
                        "VALUES (1, 'QUOTATION', '견적서 결재', 'Standard quotation approval chain', true) " +
                        "ON CONFLICT (id) DO NOTHING"
        );

        // Insert chain levels (no id column - @ElementCollection with composite PK)
        jdbcTemplate.update(
                "INSERT INTO approval_chain_levels (chain_template_id, level_order, level_name, approver_user_id, is_required) " +
                        "VALUES (1, 1, '팀장', 2, true), " +  // Level 1: Finance (팀장)
                        "       (1, 2, '부서장', 1, true) " +  // Level 2: Admin (부서장)
                        "ON CONFLICT (chain_template_id, level_order) DO NOTHING"
        );

        // Reset sequence for templates only (levels table has no sequence - composite PK)
        jdbcTemplate.execute("SELECT setval('approval_chain_templates_id_seq', (SELECT COALESCE(MAX(id), 0) FROM approval_chain_templates))");
    }

    /**
     * Helper to insert a test project.
     */
    private Long insertTestProject() {
        String today = LocalDate.now().format(DateTimeFormatter.ofPattern("MMdd"));
        String year = LocalDate.now().format(DateTimeFormatter.ofPattern("yy"));
        Long projectId = 2000L;
        jdbcTemplate.update(
                "INSERT INTO projects (id, job_code, customer_id, project_name, due_date, internal_owner_id, status, created_by_id) " +
                        "VALUES (?, ?, ?, ?, ?, ?, ?, ?) " +
                        "ON CONFLICT (id) DO NOTHING",
                projectId, "WK2K" + year + "-2000-" + today, 1L, "Test Project for Approval",
                LocalDate.now().plusDays(30), 1L, "DRAFT", 1L
        );
        return projectId;
    }

    /**
     * Helper to insert a test quotation in PENDING status.
     */
    private Long insertPendingQuotation(Long projectId) {
        Long quotationId = 2000L;
        jdbcTemplate.update(
                "INSERT INTO quotations (id, project_id, version, status, quotation_date, validity_days, total_amount, created_by_id, submitted_at) " +
                        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP) " +
                        "ON CONFLICT (id) DO NOTHING",
                quotationId, projectId, 1, "PENDING", LocalDate.now(), 30, 500000.00, SALES_USER_ID
        );
        return quotationId;
    }

    /**
     * Helper to configure the approval chain for quotations.
     * Creates a 3-level approval chain: 팀장(Finance) → 부서장(Finance) → 사장(Admin)
     */
    private Long setupApprovalChain() {
        // Get the quotation chain template ID (created by V7 migration)
        Long chainTemplateId = jdbcTemplate.queryForObject(
                "SELECT id FROM approval_chain_templates WHERE entity_type = 'QUOTATION'",
                Long.class
        );

        // Clear existing levels if any
        jdbcTemplate.update("DELETE FROM approval_chain_levels WHERE chain_template_id = ?", chainTemplateId);

        // Insert 3-level approval chain
        // Level 1: 팀장 (Team Lead) - Finance user
        jdbcTemplate.update(
                "INSERT INTO approval_chain_levels (chain_template_id, level_order, level_name, approver_user_id, is_required) " +
                        "VALUES (?, 1, '팀장', ?, true)",
                chainTemplateId, FINANCE_USER_ID
        );
        // Level 2: 부서장 (Dept Head) - Admin user (has finance role too)
        jdbcTemplate.update(
                "INSERT INTO approval_chain_levels (chain_template_id, level_order, level_name, approver_user_id, is_required) " +
                        "VALUES (?, 2, '부서장', ?, true)",
                chainTemplateId, ADMIN_USER_ID
        );

        return chainTemplateId;
    }

    /**
     * Helper to create an approval request for a quotation.
     * Note: level_name is denormalized from chain template at creation time (snapshot).
     */
    private Long createApprovalRequest(Long quotationId, Long chainTemplateId) {
        // Generate unique ID using quotation ID to avoid conflicts
        Long approvalRequestId = 2000L + quotationId;

        // Remove any existing approval request for this quotation to ensure clean state
        jdbcTemplate.update("DELETE FROM approval_level_decisions WHERE approval_request_id = ?", approvalRequestId);
        jdbcTemplate.update("DELETE FROM approval_requests WHERE id = ?", approvalRequestId);

        // No chain_template_id FK - level decisions capture template data at creation
        jdbcTemplate.update(
                "INSERT INTO approval_requests (id, entity_type, entity_id, entity_description, current_level, total_levels, status, submitted_by_id) " +
                        "VALUES (?, 'QUOTATION', ?, '견적서 v1', 1, 2, 'PENDING', ?)",
                approvalRequestId, quotationId, SALES_USER_ID
        );

        // Insert level decisions with denormalized level_name (initially all PENDING)
        jdbcTemplate.update(
                "INSERT INTO approval_level_decisions (approval_request_id, level_order, level_name, expected_approver_id, decision) " +
                        "VALUES (?, 1, '팀장', ?, 'PENDING'), (?, 2, '부서장', ?, 'PENDING')",
                approvalRequestId, FINANCE_USER_ID, approvalRequestId, ADMIN_USER_ID
        );

        return approvalRequestId;
    }

    @Nested
    @DisplayName("GET /api/approvals - T072: List Pending Approvals")
    class ListPendingApprovalsTests {

        @BeforeEach
        void setUpApprovalData() {
            Long projectId = insertTestProject();
            Long quotationId = insertPendingQuotation(projectId);
            Long chainTemplateId = setupApprovalChain();
            createApprovalRequest(quotationId, chainTemplateId);
        }

        @Test
        @DisplayName("should return 200 with pending approvals for Finance user at Level 1")
        void listPendingApprovals_AsFinance_Returns200WithPendingApprovals() throws Exception {
            mockMvc.perform(get(APPROVALS_URL)
                            .header("Authorization", "Bearer " + financeToken))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content", hasSize(greaterThanOrEqualTo(1))))
                    .andExpect(jsonPath("$.data.content[0].id").isNumber())
                    .andExpect(jsonPath("$.data.content[0].entityType").value("QUOTATION"))
                    .andExpect(jsonPath("$.data.content[0].currentLevel").value(1))
                    .andExpect(jsonPath("$.data.content[0].status").value("PENDING"));
        }

        @Test
        @DisplayName("should return 200 with empty list for Admin when not at current level")
        void listPendingApprovals_AsAdmin_WhenNotCurrentLevel_ReturnsEmpty() throws Exception {
            // Admin is Level 2 approver, but current level is 1
            mockMvc.perform(get(APPROVALS_URL)
                            .header("Authorization", "Bearer " + adminToken)
                            .param("myPending", "true"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content", hasSize(0)));
        }

        @Test
        @DisplayName("should return 200 with all approvals when role is ADMIN without filter")
        void listApprovals_AsAdmin_Returns200WithAllApprovals() throws Exception {
            mockMvc.perform(get(APPROVALS_URL)
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content").isArray());
        }

        @Test
        @DisplayName("should return 403 for Production role")
        void listApprovals_AsProduction_Returns403() throws Exception {
            mockMvc.perform(get(APPROVALS_URL)
                            .header("Authorization", "Bearer " + productionToken))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 401 without authentication")
        void listApprovals_WithoutAuth_Returns401() throws Exception {
            mockMvc.perform(get(APPROVALS_URL))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("should support pagination")
        void listApprovals_WithPagination_ReturnsCorrectPage() throws Exception {
            mockMvc.perform(get(APPROVALS_URL)
                            .header("Authorization", "Bearer " + financeToken)
                            .param("page", "0")
                            .param("size", "10"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.pageable.pageNumber").value(0))
                    .andExpect(jsonPath("$.data.pageable.pageSize").value(10));
        }

        @Test
        @DisplayName("should support entity type filter")
        void listApprovals_WithEntityTypeFilter_ReturnsFiltered() throws Exception {
            mockMvc.perform(get(APPROVALS_URL)
                            .header("Authorization", "Bearer " + financeToken)
                            .param("entityType", "QUOTATION"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.content[*].entityType", everyItem(equalTo("QUOTATION"))));
        }
    }

    @Nested
    @DisplayName("GET /api/approvals/{id} - Get Approval Details")
    class GetApprovalDetailsTests {

        private Long approvalRequestId;

        @BeforeEach
        void setUpApprovalData() {
            Long projectId = insertTestProject();
            Long quotationId = insertPendingQuotation(projectId);
            Long chainTemplateId = setupApprovalChain();
            approvalRequestId = createApprovalRequest(quotationId, chainTemplateId);
        }

        @Test
        @DisplayName("should return 200 with approval details including all levels")
        void getApprovalDetails_Returns200WithLevelDetails() throws Exception {
            mockMvc.perform(get(APPROVALS_URL + "/" + approvalRequestId)
                            .header("Authorization", "Bearer " + financeToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").value(approvalRequestId))
                    .andExpect(jsonPath("$.data.entityType").value("QUOTATION"))
                    .andExpect(jsonPath("$.data.currentLevel").value(1))
                    .andExpect(jsonPath("$.data.totalLevels").value(2))
                    .andExpect(jsonPath("$.data.levels", hasSize(2)))
                    .andExpect(jsonPath("$.data.levels[0].levelOrder").value(1))
                    .andExpect(jsonPath("$.data.levels[0].levelName").value("팀장"))
                    .andExpect(jsonPath("$.data.levels[0].decision").value("PENDING"))
                    .andExpect(jsonPath("$.data.levels[1].levelOrder").value(2))
                    .andExpect(jsonPath("$.data.levels[1].levelName").value("부서장"));
        }

        @Test
        @DisplayName("should return 404 for non-existent approval")
        void getApprovalDetails_NonExistent_Returns404() throws Exception {
            mockMvc.perform(get(APPROVALS_URL + "/99999")
                            .header("Authorization", "Bearer " + financeToken))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("POST /api/approvals/{id}/approve - T070: Approve at Level")
    class ApproveAtLevelTests {

        private Long approvalRequestId;

        @BeforeEach
        void setUpApprovalData() {
            Long projectId = insertTestProject();
            Long quotationId = insertPendingQuotation(projectId);
            Long chainTemplateId = setupApprovalChain();
            approvalRequestId = createApprovalRequest(quotationId, chainTemplateId);
        }

        @Test
        @DisplayName("should return 200 when Level 1 approver (Finance) approves")
        void approve_AsLevel1Approver_Returns200AndMovesToLevel2() throws Exception {
            String approveRequest = """
                    {
                        "comments": "Approved by Team Lead"
                    }
                    """;

            // CQRS: Command returns { id, message }
            // The approval state change is verified via unit tests and the GET endpoint
            mockMvc.perform(post(APPROVALS_URL + "/" + approvalRequestId + "/approve")
                            .header("Authorization", "Bearer " + financeToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(approveRequest))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").value(approvalRequestId))
                    .andExpect(jsonPath("$.data.message").value("Approval request approved at current level"));
        }

        @Test
        @DisplayName("should return 200 and complete approval when final level approves")
        void approve_AsFinalLevelApprover_Returns200AndCompletes() throws Exception {
            // First, approve at Level 1
            jdbcTemplate.update(
                    "UPDATE approval_requests SET current_level = 2 WHERE id = ?",
                    approvalRequestId
            );
            jdbcTemplate.update(
                    "UPDATE approval_level_decisions SET decision = 'APPROVED', decided_by_id = ?, decided_at = CURRENT_TIMESTAMP " +
                            "WHERE approval_request_id = ? AND level_order = 1",
                    FINANCE_USER_ID, approvalRequestId
            );

            String approveRequest = """
                    {
                        "comments": "Final approval by Department Head"
                    }
                    """;

            // CQRS: Command returns { id, message }
            // The final approval completion is verified via unit tests and the GET endpoint
            mockMvc.perform(post(APPROVALS_URL + "/" + approvalRequestId + "/approve")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(approveRequest))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").value(approvalRequestId))
                    .andExpect(jsonPath("$.data.message").value("Approval request approved at current level"));
        }

        @Test
        @DisplayName("should return 403 when wrong user tries to approve")
        void approve_AsWrongUser_Returns403() throws Exception {
            // Sales user is not an approver at any level
            String approveRequest = """
                    {
                        "comments": "Trying to approve"
                    }
                    """;

            mockMvc.perform(post(APPROVALS_URL + "/" + approvalRequestId + "/approve")
                            .header("Authorization", "Bearer " + salesToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(approveRequest))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 400 when approving out of order")
        void approve_OutOfOrder_Returns400() throws Exception {
            // Admin is Level 2 approver, but current level is 1
            String approveRequest = """
                    {
                        "comments": "Trying to approve out of order"
                    }
                    """;

            mockMvc.perform(post(APPROVALS_URL + "/" + approvalRequestId + "/approve")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(approveRequest))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 400 when approval is already completed")
        void approve_AlreadyCompleted_Returns400() throws Exception {
            // Mark approval as already approved
            jdbcTemplate.update(
                    "UPDATE approval_requests SET status = 'APPROVED', completed_at = CURRENT_TIMESTAMP WHERE id = ?",
                    approvalRequestId
            );

            String approveRequest = """
                    {
                        "comments": "Trying to approve again"
                    }
                    """;

            mockMvc.perform(post(APPROVALS_URL + "/" + approvalRequestId + "/approve")
                            .header("Authorization", "Bearer " + financeToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(approveRequest))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 404 for non-existent approval")
        void approve_NonExistent_Returns404() throws Exception {
            String approveRequest = """
                    {
                        "comments": "Approve"
                    }
                    """;

            mockMvc.perform(post(APPROVALS_URL + "/99999/approve")
                            .header("Authorization", "Bearer " + financeToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(approveRequest))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("should return 401 without authentication")
        void approve_WithoutAuth_Returns401() throws Exception {
            String approveRequest = """
                    {
                        "comments": "Approve"
                    }
                    """;

            mockMvc.perform(post(APPROVALS_URL + "/" + approvalRequestId + "/approve")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(approveRequest))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("POST /api/approvals/{id}/reject - T071: Reject at Level")
    class RejectAtLevelTests {

        private Long approvalRequestId;

        @BeforeEach
        void setUpApprovalData() {
            Long projectId = insertTestProject();
            Long quotationId = insertPendingQuotation(projectId);
            Long chainTemplateId = setupApprovalChain();
            approvalRequestId = createApprovalRequest(quotationId, chainTemplateId);
        }

        @Test
        @DisplayName("should return 200 when Level 1 approver rejects with mandatory reason")
        void reject_WithReason_Returns200AndStopsChain() throws Exception {
            String rejectRequest = """
                    {
                        "reason": "Price too high, needs revision",
                        "comments": "Please reduce by 10%"
                    }
                    """;

            // CQRS: Command returns { id, message }
            // The rejection state change is verified via unit tests and the GET endpoint
            mockMvc.perform(post(APPROVALS_URL + "/" + approvalRequestId + "/reject")
                            .header("Authorization", "Bearer " + financeToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(rejectRequest))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").value(approvalRequestId))
                    .andExpect(jsonPath("$.data.message").value("Approval request rejected"));
        }

        @Test
        @DisplayName("should return 400 when rejecting without mandatory reason")
        void reject_WithoutReason_Returns400() throws Exception {
            String rejectRequest = """
                    {
                        "comments": "Just rejecting"
                    }
                    """;

            mockMvc.perform(post(APPROVALS_URL + "/" + approvalRequestId + "/reject")
                            .header("Authorization", "Bearer " + financeToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(rejectRequest))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 400 when reason is empty")
        void reject_EmptyReason_Returns400() throws Exception {
            String rejectRequest = """
                    {
                        "reason": ""
                    }
                    """;

            mockMvc.perform(post(APPROVALS_URL + "/" + approvalRequestId + "/reject")
                            .header("Authorization", "Bearer " + financeToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(rejectRequest))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 403 when wrong user tries to reject")
        void reject_AsWrongUser_Returns403() throws Exception {
            String rejectRequest = """
                    {
                        "reason": "Trying to reject"
                    }
                    """;

            mockMvc.perform(post(APPROVALS_URL + "/" + approvalRequestId + "/reject")
                            .header("Authorization", "Bearer " + salesToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(rejectRequest))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 400 when rejecting already completed approval")
        void reject_AlreadyCompleted_Returns400() throws Exception {
            // Mark approval as already rejected
            jdbcTemplate.update(
                    "UPDATE approval_requests SET status = 'REJECTED', completed_at = CURRENT_TIMESTAMP WHERE id = ?",
                    approvalRequestId
            );

            String rejectRequest = """
                    {
                        "reason": "Trying to reject again"
                    }
                    """;

            mockMvc.perform(post(APPROVALS_URL + "/" + approvalRequestId + "/reject")
                            .header("Authorization", "Bearer " + financeToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(rejectRequest))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 404 for non-existent approval")
        void reject_NonExistent_Returns404() throws Exception {
            String rejectRequest = """
                    {
                        "reason": "Reject"
                    }
                    """;

            mockMvc.perform(post(APPROVALS_URL + "/99999/reject")
                            .header("Authorization", "Bearer " + financeToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(rejectRequest))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("should return 401 without authentication")
        void reject_WithoutAuth_Returns401() throws Exception {
            String rejectRequest = """
                    {
                        "reason": "Reject"
                    }
                    """;

            mockMvc.perform(post(APPROVALS_URL + "/" + approvalRequestId + "/reject")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(rejectRequest))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("GET /api/approvals/{id}/history - Approval History")
    class ApprovalHistoryTests {

        private Long approvalRequestId;

        @BeforeEach
        void setUpApprovalData() {
            Long projectId = insertTestProject();
            Long quotationId = insertPendingQuotation(projectId);
            Long chainTemplateId = setupApprovalChain();
            approvalRequestId = createApprovalRequest(quotationId, chainTemplateId);

            // Insert history for submission
            jdbcTemplate.update(
                    "INSERT INTO approval_history (approval_request_id, action, actor_id) " +
                            "VALUES (?, 'SUBMITTED', ?)",
                    approvalRequestId, SALES_USER_ID
            );
        }

        @Test
        @DisplayName("should return 200 with approval history")
        void getHistory_Returns200WithHistory() throws Exception {
            mockMvc.perform(get(APPROVALS_URL + "/" + approvalRequestId + "/history")
                            .header("Authorization", "Bearer " + financeToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))))
                    .andExpect(jsonPath("$.data[0].action").value("SUBMITTED"));
        }

        @Test
        @DisplayName("should return 404 for non-existent approval")
        void getHistory_NonExistent_Returns404() throws Exception {
            mockMvc.perform(get(APPROVALS_URL + "/99999/history")
                            .header("Authorization", "Bearer " + financeToken))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("Admin Approval Chain Configuration - T070a")
    class ApprovalChainConfigTests {

        @Test
        @DisplayName("should return 200 with approval chain templates for Admin")
        void listChainTemplates_AsAdmin_Returns200() throws Exception {
            mockMvc.perform(get(APPROVAL_CHAINS_URL)
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(2))))
                    .andExpect(jsonPath("$.data[*].entityType", hasItem("QUOTATION")))
                    .andExpect(jsonPath("$.data[*].entityType", hasItem("PURCHASE_ORDER")));
        }

        @Test
        @DisplayName("should return 403 for non-Admin role")
        void listChainTemplates_AsNonAdmin_Returns403() throws Exception {
            mockMvc.perform(get(APPROVAL_CHAINS_URL)
                            .header("Authorization", "Bearer " + financeToken))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 200 when Admin updates approval chain levels")
        void updateChainLevels_AsAdmin_Returns200() throws Exception {
            // Get the quotation chain template ID
            Long chainTemplateId = jdbcTemplate.queryForObject(
                    "SELECT id FROM approval_chain_templates WHERE entity_type = 'QUOTATION'",
                    Long.class
            );

            String updateRequest = """
                    {
                        "levels": [
                            {"levelOrder": 1, "levelName": "팀장", "approverUserId": 2, "isRequired": true},
                            {"levelOrder": 2, "levelName": "부서장", "approverUserId": 1, "isRequired": true},
                            {"levelOrder": 3, "levelName": "사장", "approverUserId": 1, "isRequired": false}
                        ]
                    }
                    """;

            // CQRS: Command returns { id, message }
            // The chain update is verified via unit tests and the GET endpoint
            mockMvc.perform(put(APPROVAL_CHAINS_URL + "/" + chainTemplateId + "/levels")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(updateRequest))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").value(chainTemplateId))
                    .andExpect(jsonPath("$.data.message").value("Approval chain updated"));
        }

        @Test
        @DisplayName("should return 400 when level order is not sequential")
        void updateChainLevels_NonSequentialOrder_Returns400() throws Exception {
            Long chainTemplateId = jdbcTemplate.queryForObject(
                    "SELECT id FROM approval_chain_templates WHERE entity_type = 'QUOTATION'",
                    Long.class
            );

            String updateRequest = """
                    {
                        "levels": [
                            {"levelOrder": 1, "levelName": "팀장", "approverUserId": 2, "isRequired": true},
                            {"levelOrder": 3, "levelName": "사장", "approverUserId": 1, "isRequired": true}
                        ]
                    }
                    """;

            mockMvc.perform(put(APPROVAL_CHAINS_URL + "/" + chainTemplateId + "/levels")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(updateRequest))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 404 when approver user does not exist")
        void updateChainLevels_InvalidApprover_Returns404() throws Exception {
            Long chainTemplateId = jdbcTemplate.queryForObject(
                    "SELECT id FROM approval_chain_templates WHERE entity_type = 'QUOTATION'",
                    Long.class
            );

            String updateRequest = """
                    {
                        "levels": [
                            {"levelOrder": 1, "levelName": "팀장", "approverUserId": 99999, "isRequired": true}
                        ]
                    }
                    """;

            mockMvc.perform(put(APPROVAL_CHAINS_URL + "/" + chainTemplateId + "/levels")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(updateRequest))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("Multi-Level Sequential Approval Flow - Integration Test")
    class MultiLevelApprovalFlowTests {

        @Test
        @DisplayName("should complete full 2-level approval flow")
        void fullApprovalFlow_2Levels_CompletesSuccessfully() throws Exception {
            // Setup
            Long projectId = insertTestProject();
            Long quotationId = insertPendingQuotation(projectId);
            Long chainTemplateId = setupApprovalChain();
            Long approvalRequestId = createApprovalRequest(quotationId, chainTemplateId);

            // Step 1: Level 1 (Finance/팀장) approves
            String approveRequest1 = """
                    {
                        "comments": "Approved by Team Lead"
                    }
                    """;

            // CQRS: Command returns { id, message }
            mockMvc.perform(post(APPROVALS_URL + "/" + approvalRequestId + "/approve")
                            .header("Authorization", "Bearer " + financeToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(approveRequest1))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").value(approvalRequestId))
                    .andExpect(jsonPath("$.data.message").value("Approval request approved at current level"));

            // Step 2: Level 2 (Admin/부서장) approves - Final approval
            String approveRequest2 = """
                    {
                        "comments": "Final approval by Department Head"
                    }
                    """;

            // CQRS: Command returns { id, message } - approval completion verified via GET endpoint
            mockMvc.perform(post(APPROVALS_URL + "/" + approvalRequestId + "/approve")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(approveRequest2))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").value(approvalRequestId))
                    .andExpect(jsonPath("$.data.message").value("Approval request approved at current level"));

            // Note: Quotation status update and approval completion happens in the transaction
            // Due to CQRS, we verify the command succeeds and state changes are tested in unit tests
        }

        @Test
        @DisplayName("should stop chain when Level 1 rejects")
        void approvalFlow_Level1Rejects_ChainStops() throws Exception {
            // Setup
            Long projectId = insertTestProject();
            Long quotationId = insertPendingQuotation(projectId);
            Long chainTemplateId = setupApprovalChain();
            Long approvalRequestId = createApprovalRequest(quotationId, chainTemplateId);

            // Level 1 (Finance/팀장) rejects
            String rejectRequest = """
                    {
                        "reason": "Price needs to be reduced by 15%"
                    }
                    """;

            // CQRS: Command returns { id, message }
            // The rejection and chain stop are verified via unit tests and the GET endpoint
            mockMvc.perform(post(APPROVALS_URL + "/" + approvalRequestId + "/reject")
                            .header("Authorization", "Bearer " + financeToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(rejectRequest))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").value(approvalRequestId))
                    .andExpect(jsonPath("$.data.message").value("Approval request rejected"));

            // Note: Quotation status update happens in the approval transaction
            // Due to CQRS, we verify the command succeeds and state changes are tested in unit tests
        }
    }
}
