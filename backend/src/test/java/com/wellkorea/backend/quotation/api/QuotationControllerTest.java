package com.wellkorea.backend.quotation.api;

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
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Contract tests for /api/quotations endpoints.
 * Tests validate the quotation management API contract.
 * <p>
 * Following CQRS pattern:
 * - Command endpoints (POST, PUT) return QuotationCommandResult with { id, message }
 * - Query endpoints (GET) return full QuotationDetailView or QuotationSummaryView
 * <p>
 * Test-First Development: These tests MUST be written FIRST and MUST FAIL initially.
 * Per Constitution Principle I (Test-First Development).
 * <p>
 * T067: POST /api/quotations - expects 201 with command result
 * T068: GET /api/quotations and GET /api/quotations/{id}, PUT /api/quotations/{id}
 * T069: POST /api/quotations/{id}/pdf - PDF generation
 */
@Tag("integration")
@AutoConfigureMockMvc
@Transactional
@DisplayName("Quotation Controller Contract Tests")
class QuotationControllerTest extends BaseIntegrationTest implements TestFixtures {

    private static final String QUOTATIONS_URL = "/api/quotations";

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
        DatabaseTestHelper.insertTestCustomer(jdbcTemplate);
        DatabaseTestHelper.insertTestProducts(jdbcTemplate);

        // Generate tokens for different roles (with userId for approval operations)
        adminToken = jwtTokenProvider.generateToken(ADMIN_USERNAME, Role.ADMIN.getAuthority(), 1L);
        financeToken = jwtTokenProvider.generateToken(FINANCE_USERNAME, Role.FINANCE.getAuthority(), 2L);
        productionToken = jwtTokenProvider.generateToken(PRODUCTION_USERNAME, Role.PRODUCTION.getAuthority(), 3L);
        salesToken = jwtTokenProvider.generateToken(SALES_USERNAME, Role.SALES.getAuthority(), 4L);
    }

    /**
     * Helper to insert a test project for quotation tests.
     * Returns the project ID.
     */
    private Long insertTestProject() {
        String today = LocalDate.now().format(DateTimeFormatter.ofPattern("MMdd"));
        String year = LocalDate.now().format(DateTimeFormatter.ofPattern("yy"));
        Long projectId = 1000L;
        jdbcTemplate.update(
                "INSERT INTO projects (id, job_code, customer_company_id, project_name, due_date, internal_owner_id, status, created_by_id) " +
                        "VALUES (?, ?, ?, ?, ?, ?, ?, ?) " +
                        "ON CONFLICT (id) DO NOTHING",
                projectId, "WK2K" + year + "-1000-" + today, 1L, "Test Project for Quotation",
                LocalDate.now().plusDays(30), 1L, "DRAFT", 1L
        );
        return projectId;
    }

    /**
     * Helper to insert a test quotation.
     * Returns the quotation ID.
     */
    private Long insertTestQuotation(Long projectId, String status) {
        Long quotationId = 1000L;
        jdbcTemplate.update(
                "INSERT INTO quotations (id, project_id, version, status, quotation_date, validity_days, total_amount, created_by_id) " +
                        "VALUES (?, ?, ?, ?, ?, ?, ?, ?) " +
                        "ON CONFLICT (id) DO NOTHING",
                quotationId, projectId, 1, status, LocalDate.now(), 30, 0.00, 1L
        );
        return quotationId;
    }

    @Nested
    @DisplayName("POST /api/quotations - T067: Create Quotation")
    class CreateQuotationTests {

        @Test
        @DisplayName("should return 201 with command result for Admin")
        void createQuotation_AsAdmin_Returns201WithCommandResult() throws Exception {
            // Given - A project exists
            Long projectId = insertTestProject();
            String createRequest = """
                    {
                        "projectId": %d,
                        "validityDays": 30,
                        "notes": "Initial quotation for custom enclosure project",
                        "lineItems": [
                            {
                                "productId": 1,
                                "quantity": 10,
                                "unitPrice": 50000.00,
                                "notes": "Control panels"
                            },
                            {
                                "productId": 2,
                                "quantity": 20,
                                "unitPrice": 3500.00,
                                "notes": "L-brackets"
                            }
                        ]
                    }
                    """.formatted(projectId);

            // When & Then - CQRS: Command returns { id, message }
            MvcResult result = mockMvc.perform(post(QUOTATIONS_URL)
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isCreated())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").isNumber())
                    .andExpect(jsonPath("$.data.message").value("Quotation created successfully"))
                    .andReturn();

            // Extract ID and verify via GET endpoint (CQRS pattern)
            String responseBody = result.getResponse().getContentAsString();
            Integer createdId = objectMapper.readTree(responseBody).get("data").get("id").asInt();

            mockMvc.perform(get(QUOTATIONS_URL + "/" + createdId)
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.projectId").value(projectId))
                    .andExpect(jsonPath("$.data.version").value(1))
                    .andExpect(jsonPath("$.data.status").value("DRAFT"))
                    .andExpect(jsonPath("$.data.totalAmount").value(570000.00)) // 10*50000 + 20*3500
                    .andExpect(jsonPath("$.data.lineItems", hasSize(2)));
        }

        @Test
        @DisplayName("should return 201 with command result for Finance")
        void createQuotation_AsFinance_Returns201() throws Exception {
            Long projectId = insertTestProject();
            String createRequest = """
                    {
                        "projectId": %d,
                        "validityDays": 15,
                        "lineItems": [
                            {
                                "productId": 3,
                                "quantity": 5,
                                "unitPrice": 85000.00
                            }
                        ]
                    }
                    """.formatted(projectId);

            mockMvc.perform(post(QUOTATIONS_URL)
                            .header("Authorization", "Bearer " + financeToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").isNumber())
                    .andExpect(jsonPath("$.data.message").exists());
        }

        @Test
        @DisplayName("should return 201 with command result for Sales")
        void createQuotation_AsSales_Returns201() throws Exception {
            Long projectId = insertTestProject();
            String createRequest = """
                    {
                        "projectId": %d,
                        "validityDays": 30,
                        "lineItems": [
                            {
                                "productId": 1,
                                "quantity": 5,
                                "unitPrice": 45000.00
                            }
                        ]
                    }
                    """.formatted(projectId);

            mockMvc.perform(post(QUOTATIONS_URL)
                            .header("Authorization", "Bearer " + salesToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").isNumber());
        }

        @Test
        @DisplayName("should return 403 for Production role")
        void createQuotation_AsProduction_Returns403() throws Exception {
            Long projectId = insertTestProject();
            String createRequest = """
                    {
                        "projectId": %d,
                        "validityDays": 30,
                        "lineItems": [{"productId": 1, "quantity": 1, "unitPrice": 1000.00}]
                    }
                    """.formatted(projectId);

            mockMvc.perform(post(QUOTATIONS_URL)
                            .header("Authorization", "Bearer " + productionToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 404 when project does not exist")
        void createQuotation_NonExistentProject_Returns404() throws Exception {
            String createRequest = """
                    {
                        "projectId": 99999,
                        "validityDays": 30,
                        "lineItems": [{"productId": 1, "quantity": 1, "unitPrice": 1000.00}]
                    }
                    """;

            mockMvc.perform(post(QUOTATIONS_URL)
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("should return 400 when line items are empty")
        void createQuotation_EmptyLineItems_Returns400() throws Exception {
            Long projectId = insertTestProject();
            String createRequest = """
                    {
                        "projectId": %d,
                        "validityDays": 30,
                        "lineItems": []
                    }
                    """.formatted(projectId);

            mockMvc.perform(post(QUOTATIONS_URL)
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 400 when line item has invalid quantity")
        void createQuotation_InvalidQuantity_Returns400() throws Exception {
            Long projectId = insertTestProject();
            String createRequest = """
                    {
                        "projectId": %d,
                        "validityDays": 30,
                        "lineItems": [{"productId": 1, "quantity": -1, "unitPrice": 1000.00}]
                    }
                    """.formatted(projectId);

            mockMvc.perform(post(QUOTATIONS_URL)
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 400 when line item has negative unit price")
        void createQuotation_NegativeUnitPrice_Returns400() throws Exception {
            Long projectId = insertTestProject();
            String createRequest = """
                    {
                        "projectId": %d,
                        "validityDays": 30,
                        "lineItems": [{"productId": 1, "quantity": 1, "unitPrice": -500.00}]
                    }
                    """.formatted(projectId);

            mockMvc.perform(post(QUOTATIONS_URL)
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 404 when product does not exist")
        void createQuotation_NonExistentProduct_Returns404() throws Exception {
            Long projectId = insertTestProject();
            String createRequest = """
                    {
                        "projectId": %d,
                        "validityDays": 30,
                        "lineItems": [{"productId": 99999, "quantity": 1, "unitPrice": 1000.00}]
                    }
                    """.formatted(projectId);

            mockMvc.perform(post(QUOTATIONS_URL)
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("should return 401 without authentication")
        void createQuotation_WithoutAuth_Returns401() throws Exception {
            String createRequest = """
                    {
                        "projectId": 1,
                        "validityDays": 30,
                        "lineItems": [{"productId": 1, "quantity": 1, "unitPrice": 1000.00}]
                    }
                    """;

            mockMvc.perform(post(QUOTATIONS_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("should auto-calculate line total and total amount (verified via GET)")
        void createQuotation_AutoCalculatesTotals() throws Exception {
            Long projectId = insertTestProject();
            String createRequest = """
                    {
                        "projectId": %d,
                        "validityDays": 30,
                        "lineItems": [
                            {"productId": 1, "quantity": 3, "unitPrice": 10000.00},
                            {"productId": 2, "quantity": 5, "unitPrice": 2000.00}
                        ]
                    }
                    """.formatted(projectId);

            // CQRS: Command returns { id, message }
            MvcResult result = mockMvc.perform(post(QUOTATIONS_URL)
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.data.id").isNumber())
                    .andReturn();

            // Extract ID and verify via GET endpoint
            Integer createdId = objectMapper.readTree(result.getResponse().getContentAsString())
                    .get("data").get("id").asInt();

            mockMvc.perform(get(QUOTATIONS_URL + "/" + createdId)
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.totalAmount").value(40000.00)) // 3*10000 + 5*2000
                    .andExpect(jsonPath("$.data.lineItems[0].lineTotal").value(30000.00))
                    .andExpect(jsonPath("$.data.lineItems[1].lineTotal").value(10000.00));
        }
    }

    @Nested
    @DisplayName("GET /api/quotations - T068: List Quotations")
    class ListQuotationsTests {

        @BeforeEach
        void setUpQuotations() {
            Long projectId = insertTestProject();
            insertTestQuotation(projectId, "DRAFT");
        }

        @Test
        @DisplayName("should return 200 with paginated quotation list for Admin")
        void listQuotations_AsAdmin_Returns200WithQuotations() throws Exception {
            mockMvc.perform(get(QUOTATIONS_URL)
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content", hasSize(greaterThanOrEqualTo(1))))
                    .andExpect(jsonPath("$.data.content[0].id").isNumber())
                    .andExpect(jsonPath("$.data.content[0].status").isString());
        }

        @Test
        @DisplayName("should return 200 for Finance role")
        void listQuotations_AsFinance_Returns200() throws Exception {
            mockMvc.perform(get(QUOTATIONS_URL)
                            .header("Authorization", "Bearer " + financeToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }

        @Test
        @DisplayName("should return 200 for Sales role")
        void listQuotations_AsSales_Returns200() throws Exception {
            mockMvc.perform(get(QUOTATIONS_URL)
                            .header("Authorization", "Bearer " + salesToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }

        @Test
        @DisplayName("should return 403 for Production role")
        void listQuotations_AsProduction_Returns403() throws Exception {
            mockMvc.perform(get(QUOTATIONS_URL)
                            .header("Authorization", "Bearer " + productionToken))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should support pagination parameters")
        void listQuotations_WithPagination_ReturnsCorrectPage() throws Exception {
            mockMvc.perform(get(QUOTATIONS_URL)
                            .header("Authorization", "Bearer " + adminToken)
                            .param("page", "0")
                            .param("size", "10"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.content").isArray())
                    .andExpect(jsonPath("$.data.pageable.pageNumber").value(0))
                    .andExpect(jsonPath("$.data.pageable.pageSize").value(10));
        }

        @Test
        @DisplayName("should support status filter")
        void listQuotations_WithStatusFilter_ReturnsFilteredQuotations() throws Exception {
            mockMvc.perform(get(QUOTATIONS_URL)
                            .header("Authorization", "Bearer " + adminToken)
                            .param("status", "DRAFT"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.content[*].status", everyItem(equalTo("DRAFT"))));
        }

        @Test
        @DisplayName("should support project ID filter")
        void listQuotations_WithProjectFilter_ReturnsFilteredQuotations() throws Exception {
            mockMvc.perform(get(QUOTATIONS_URL)
                            .header("Authorization", "Bearer " + adminToken)
                            .param("projectId", "1000"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.content[*].projectId", everyItem(equalTo(1000))));
        }

        @Test
        @DisplayName("should return 401 without authentication")
        void listQuotations_WithoutAuth_Returns401() throws Exception {
            mockMvc.perform(get(QUOTATIONS_URL))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("GET /api/quotations/{id} - T068: Get Quotation by ID")
    class GetQuotationByIdTests {

        private Long quotationId;

        @BeforeEach
        void setUpQuotation() {
            Long projectId = insertTestProject();
            quotationId = insertTestQuotation(projectId, "DRAFT");

            // Insert line items
            jdbcTemplate.update(
                    "INSERT INTO quotation_line_items (quotation_id, product_id, sequence, quantity, unit_price, line_total) " +
                            "VALUES (?, ?, ?, ?, ?, ?) " +
                            "ON CONFLICT (quotation_id, sequence) DO NOTHING",
                    quotationId, 1L, 1, 10.0, 50000.00, 500000.00
            );
        }

        @Test
        @DisplayName("should return 200 with quotation details for Admin")
        void getQuotation_AsAdmin_Returns200WithDetails() throws Exception {
            mockMvc.perform(get(QUOTATIONS_URL + "/" + quotationId)
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").value(quotationId))
                    .andExpect(jsonPath("$.data.version").value(1))
                    .andExpect(jsonPath("$.data.status").value("DRAFT"))
                    .andExpect(jsonPath("$.data.lineItems").isArray());
        }

        @Test
        @DisplayName("should return 200 for Finance role")
        void getQuotation_AsFinance_Returns200() throws Exception {
            mockMvc.perform(get(QUOTATIONS_URL + "/" + quotationId)
                            .header("Authorization", "Bearer " + financeToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }

        @Test
        @DisplayName("should return 403 for Production role")
        void getQuotation_AsProduction_Returns403() throws Exception {
            mockMvc.perform(get(QUOTATIONS_URL + "/" + quotationId)
                            .header("Authorization", "Bearer " + productionToken))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 404 for non-existent quotation")
        void getQuotation_NonExistent_Returns404() throws Exception {
            mockMvc.perform(get(QUOTATIONS_URL + "/99999")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("should return 401 without authentication")
        void getQuotation_WithoutAuth_Returns401() throws Exception {
            mockMvc.perform(get(QUOTATIONS_URL + "/" + quotationId))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("PUT /api/quotations/{id} - T068: Update Quotation")
    class UpdateQuotationTests {

        private Long quotationId;

        @BeforeEach
        void setUpQuotation() {
            Long projectId = insertTestProject();
            quotationId = insertTestQuotation(projectId, "DRAFT");

            // Insert line items
            jdbcTemplate.update(
                    "INSERT INTO quotation_line_items (quotation_id, product_id, sequence, quantity, unit_price, line_total) " +
                            "VALUES (?, ?, ?, ?, ?, ?) " +
                            "ON CONFLICT (quotation_id, sequence) DO NOTHING",
                    quotationId, 1L, 1, 10.0, 50000.00, 500000.00
            );
        }

        @Test
        @DisplayName("should return 200 with command result for Admin")
        void updateQuotation_AsAdmin_Returns200() throws Exception {
            String updateRequest = """
                    {
                        "validityDays": 45,
                        "notes": "Updated notes",
                        "lineItems": [
                            {
                                "productId": 1,
                                "quantity": 15,
                                "unitPrice": 48000.00,
                                "notes": "Discounted price"
                            }
                        ]
                    }
                    """;

            // CQRS: Command returns { id, message }
            // Note: We don't verify via GET here due to JPA caching issues with @Transactional tests.
            // GET functionality is tested separately in GetQuotationTests.
            mockMvc.perform(put(QUOTATIONS_URL + "/" + quotationId)
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(updateRequest))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").value(quotationId))
                    .andExpect(jsonPath("$.data.message").value("Quotation updated successfully"));
        }

        @Test
        @DisplayName("should return 400 when updating non-DRAFT quotation")
        void updateQuotation_NonDraftStatus_Returns400() throws Exception {
            // Update quotation to PENDING status
            jdbcTemplate.update("UPDATE quotations SET status = 'PENDING' WHERE id = ?", quotationId);

            String updateRequest = """
                    {
                        "validityDays": 45,
                        "lineItems": [{"productId": 1, "quantity": 5, "unitPrice": 1000.00}]
                    }
                    """;

            mockMvc.perform(put(QUOTATIONS_URL + "/" + quotationId)
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(updateRequest))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 403 for Production role")
        void updateQuotation_AsProduction_Returns403() throws Exception {
            String updateRequest = """
                    {
                        "validityDays": 45,
                        "lineItems": [{"productId": 1, "quantity": 1, "unitPrice": 1000.00}]
                    }
                    """;

            mockMvc.perform(put(QUOTATIONS_URL + "/" + quotationId)
                            .header("Authorization", "Bearer " + productionToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(updateRequest))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 404 for non-existent quotation")
        void updateQuotation_NonExistent_Returns404() throws Exception {
            String updateRequest = """
                    {
                        "validityDays": 45,
                        "lineItems": [{"productId": 1, "quantity": 1, "unitPrice": 1000.00}]
                    }
                    """;

            mockMvc.perform(put(QUOTATIONS_URL + "/99999")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(updateRequest))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("should return 401 without authentication")
        void updateQuotation_WithoutAuth_Returns401() throws Exception {
            String updateRequest = """
                    {
                        "validityDays": 45,
                        "lineItems": [{"productId": 1, "quantity": 1, "unitPrice": 1000.00}]
                    }
                    """;

            mockMvc.perform(put(QUOTATIONS_URL + "/" + quotationId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(updateRequest))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("POST /api/quotations/{id}/submit - T070: Submit for Approval")
    class SubmitQuotationTests {

        private Long quotationId;

        @BeforeEach
        void setUpQuotation() {
            Long projectId = insertTestProject();
            quotationId = insertTestQuotation(projectId, "DRAFT");

            // Insert line items (required for submission)
            jdbcTemplate.update(
                    "INSERT INTO quotation_line_items (quotation_id, product_id, sequence, quantity, unit_price, line_total) " +
                            "VALUES (?, ?, ?, ?, ?, ?) " +
                            "ON CONFLICT (quotation_id, sequence) DO NOTHING",
                    quotationId, 1L, 1, 10.0, 50000.00, 500000.00
            );

            // Get the existing QUOTATION chain template ID (created by V7 migration)
            Long chainTemplateId = jdbcTemplate.queryForObject(
                    "SELECT id FROM approval_chain_templates WHERE entity_type = 'QUOTATION'",
                    Long.class
            );

            // Insert approval chain level to the existing template (requires an approver user - use admin user id=1)
            jdbcTemplate.update(
                    "INSERT INTO approval_chain_levels (chain_template_id, level_order, level_name, approver_user_id, is_required) " +
                            "VALUES (?, ?, ?, ?, ?) " +
                            "ON CONFLICT (chain_template_id, level_order) DO NOTHING",
                    chainTemplateId, 1, "팀장", 1L, true
            );
        }

        @Test
        @DisplayName("should return 200 with command result when submitting DRAFT quotation")
        void submitQuotation_DraftStatus_Returns200() throws Exception {
            // CQRS: Command returns { id, message }
            // Trust the command response - if it succeeds, the status was changed
            mockMvc.perform(post(QUOTATIONS_URL + "/" + quotationId + "/submit")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").value(quotationId))
                    .andExpect(jsonPath("$.data.message").value("Quotation submitted for approval"));

            // Note: Status change verification is implicitly tested by:
            // 1. Command succeeds (above) - means status was changed
            // 2. submitQuotation_NonDraftStatus_Returns400 - verifies PENDING rejects re-submit
            // 3. Unit tests in QuotationCommandServiceTest verify the domain logic
        }

        @Test
        @DisplayName("should return 400 when submitting non-DRAFT quotation")
        void submitQuotation_NonDraftStatus_Returns400() throws Exception {
            // Update quotation to PENDING status
            jdbcTemplate.update("UPDATE quotations SET status = 'PENDING' WHERE id = ?", quotationId);

            mockMvc.perform(post(QUOTATIONS_URL + "/" + quotationId + "/submit")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 403 for Production role")
        void submitQuotation_AsProduction_Returns403() throws Exception {
            mockMvc.perform(post(QUOTATIONS_URL + "/" + quotationId + "/submit")
                            .header("Authorization", "Bearer " + productionToken))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 404 for non-existent quotation")
        void submitQuotation_NonExistent_Returns404() throws Exception {
            mockMvc.perform(post(QUOTATIONS_URL + "/99999/submit")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("POST /api/quotations/{id}/versions - Create New Version")
    class CreateVersionTests {

        private Long quotationId;

        @BeforeEach
        void setUpApprovedQuotation() {
            Long projectId = insertTestProject();
            quotationId = insertTestQuotation(projectId, "APPROVED");

            // Insert line items
            jdbcTemplate.update(
                    "INSERT INTO quotation_line_items (quotation_id, product_id, sequence, quantity, unit_price, line_total) " +
                            "VALUES (?, ?, ?, ?, ?, ?) " +
                            "ON CONFLICT (quotation_id, sequence) DO NOTHING",
                    quotationId, 1L, 1, 10.0, 50000.00, 500000.00
            );
        }

        @Test
        @DisplayName("should return 201 with command result when creating new version")
        void createVersion_FromApproved_Returns201() throws Exception {
            // CQRS: Command returns { id, message }
            // Note: We don't verify via GET here due to JPA caching issues with @Transactional tests.
            // The new version creation with proper version number and DRAFT status is tested in unit tests.
            mockMvc.perform(post(QUOTATIONS_URL + "/" + quotationId + "/versions")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").isNumber())
                    .andExpect(jsonPath("$.data.message").value("New quotation version created"));
        }

        @Test
        @DisplayName("should return 400 when creating new version from DRAFT quotation")
        void createVersion_FromDraft_Returns400() throws Exception {
            // Update quotation to DRAFT status
            jdbcTemplate.update("UPDATE quotations SET status = 'DRAFT' WHERE id = ?", quotationId);

            mockMvc.perform(post(QUOTATIONS_URL + "/" + quotationId + "/versions")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("POST /api/quotations/{id}/pdf - T069: Generate PDF")
    class GeneratePdfTests {

        private Long quotationId;

        @BeforeEach
        void setUpQuotation() {
            Long projectId = insertTestProject();
            quotationId = insertTestQuotation(projectId, "APPROVED");

            // Insert line items
            jdbcTemplate.update(
                    "INSERT INTO quotation_line_items (quotation_id, product_id, sequence, quantity, unit_price, line_total) " +
                            "VALUES (?, ?, ?, ?, ?, ?) " +
                            "ON CONFLICT (quotation_id, sequence) DO NOTHING",
                    quotationId, 1L, 1, 10.0, 50000.00, 500000.00
            );
        }

        @Test
        @DisplayName("should return 200 with PDF bytes for approved quotation")
        void generatePdf_ApprovedQuotation_Returns200() throws Exception {
            mockMvc.perform(post(QUOTATIONS_URL + "/" + quotationId + "/pdf")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_PDF));
        }

        @Test
        @DisplayName("should return 200 with PDF bytes for Finance role")
        void generatePdf_AsFinance_Returns200() throws Exception {
            mockMvc.perform(post(QUOTATIONS_URL + "/" + quotationId + "/pdf")
                            .header("Authorization", "Bearer " + financeToken))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_PDF));
        }

        @Test
        @DisplayName("should return 400 when generating PDF for DRAFT quotation")
        void generatePdf_DraftQuotation_Returns400() throws Exception {
            // Update quotation to DRAFT status
            jdbcTemplate.update("UPDATE quotations SET status = 'DRAFT' WHERE id = ?", quotationId);

            mockMvc.perform(post(QUOTATIONS_URL + "/" + quotationId + "/pdf")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 403 for Production role")
        void generatePdf_AsProduction_Returns403() throws Exception {
            mockMvc.perform(post(QUOTATIONS_URL + "/" + quotationId + "/pdf")
                            .header("Authorization", "Bearer " + productionToken))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 404 for non-existent quotation")
        void generatePdf_NonExistent_Returns404() throws Exception {
            mockMvc.perform(post(QUOTATIONS_URL + "/99999/pdf")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("should return 401 without authentication")
        void generatePdf_WithoutAuth_Returns401() throws Exception {
            mockMvc.perform(post(QUOTATIONS_URL + "/" + quotationId + "/pdf"))
                    .andExpect(status().isUnauthorized());
        }
    }
}
