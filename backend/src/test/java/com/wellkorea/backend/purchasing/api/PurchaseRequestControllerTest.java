package com.wellkorea.backend.purchasing.api;

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

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Contract tests for /api/purchase-requests endpoints.
 * Tests validate the PurchaseRequest domain API contract with RBAC.
 * <p>
 * Test-First Development: These tests MUST be written FIRST and MUST FAIL initially.
 * Per Constitution Principle I (Test-First Development).
 * <p>
 * RBAC Rules:
 * - Admin, Finance, Production: Full CRUD access
 * - Sales: Read-only access (can view their project's purchase requests)
 */
@Tag("integration")
@AutoConfigureMockMvc
@Transactional
@DisplayName("Purchase Request Controller Contract Tests")
class PurchaseRequestControllerTest extends BaseIntegrationTest implements TestFixtures {

    private static final String PURCHASE_REQUESTS_URL = "/api/purchase-requests";

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

        // Generate tokens for different roles
        adminToken = jwtTokenProvider.generateToken(ADMIN_USERNAME, Role.ADMIN.getAuthority(), TEST_USER_ID);
        financeToken = jwtTokenProvider.generateToken(FINANCE_USERNAME, Role.FINANCE.getAuthority(), 2L);
        salesToken = jwtTokenProvider.generateToken(SALES_USERNAME, Role.SALES.getAuthority(), 4L);
        productionToken = jwtTokenProvider.generateToken(PRODUCTION_USERNAME, Role.PRODUCTION.getAuthority(), 3L);

        // Insert test data
        insertTestServiceCategory(1L, "CNC Machining");
        insertTestCustomerCompany(10L, "Test Customer");
        insertTestProject(1L, "WK2K25-0001-0115", 10L, 1L);
    }

    // ==========================================================================
    // POST /api/purchase-requests/service - Create Service Purchase Request
    // ==========================================================================

    @Nested
    @DisplayName("POST /api/purchase-requests/service - Create Service Purchase Request")
    class CreateServicePurchaseRequestTests {

        @Test
        @DisplayName("should return 201 with command result when Admin creates service purchase request")
        void createServicePurchaseRequest_AsAdmin_Returns201() throws Exception {
            String createRequest = """
                    {
                        "projectId": 1,
                        "serviceCategoryId": 1,
                        "description": "CNC machining for project components",
                        "quantity": 10.0,
                        "uom": "EA",
                        "requiredDate": "2025-02-15"
                    }
                    """;

            mockMvc.perform(post(PURCHASE_REQUESTS_URL + "/service")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isCreated())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").isNumber())
                    .andExpect(jsonPath("$.data.message").value("Purchase request created successfully"));
        }

        @Test
        @DisplayName("should return 201 when Finance creates service purchase request")
        void createServicePurchaseRequest_AsFinance_Returns201() throws Exception {
            String createRequest = """
                    {
                        "serviceCategoryId": 1,
                        "description": "General purchasing",
                        "quantity": 5.0,
                        "requiredDate": "2025-02-15"
                    }
                    """;

            mockMvc.perform(post(PURCHASE_REQUESTS_URL + "/service")
                            .header("Authorization", "Bearer " + financeToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true));
        }

        @Test
        @DisplayName("should return 201 when Production creates service purchase request")
        void createServicePurchaseRequest_AsProduction_Returns201() throws Exception {
            String createRequest = """
                    {
                        "projectId": 1,
                        "serviceCategoryId": 1,
                        "description": "Production materials",
                        "quantity": 20.0,
                        "requiredDate": "2025-02-15"
                    }
                    """;

            mockMvc.perform(post(PURCHASE_REQUESTS_URL + "/service")
                            .header("Authorization", "Bearer " + productionToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true));
        }

        @Test
        @DisplayName("should return 403 when Sales creates service purchase request")
        void createServicePurchaseRequest_AsSales_Returns403() throws Exception {
            String createRequest = """
                    {
                        "serviceCategoryId": 1,
                        "description": "Unauthorized request",
                        "quantity": 5.0,
                        "requiredDate": "2025-02-15"
                    }
                    """;

            mockMvc.perform(post(PURCHASE_REQUESTS_URL + "/service")
                            .header("Authorization", "Bearer " + salesToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 400 when serviceCategoryId is missing")
        void createServicePurchaseRequest_MissingServiceCategoryId_Returns400() throws Exception {
            String createRequest = """
                    {
                        "description": "Missing category",
                        "quantity": 5.0,
                        "requiredDate": "2025-02-15"
                    }
                    """;

            mockMvc.perform(post(PURCHASE_REQUESTS_URL + "/service")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 400 when description is missing")
        void createServicePurchaseRequest_MissingDescription_Returns400() throws Exception {
            String createRequest = """
                    {
                        "serviceCategoryId": 1,
                        "quantity": 5.0,
                        "requiredDate": "2025-02-15"
                    }
                    """;

            mockMvc.perform(post(PURCHASE_REQUESTS_URL + "/service")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 400 when quantity is zero or negative")
        void createServicePurchaseRequest_InvalidQuantity_Returns400() throws Exception {
            String createRequest = """
                    {
                        "serviceCategoryId": 1,
                        "description": "Invalid quantity",
                        "quantity": 0,
                        "requiredDate": "2025-02-15"
                    }
                    """;

            mockMvc.perform(post(PURCHASE_REQUESTS_URL + "/service")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 404 when service category not found")
        void createServicePurchaseRequest_ServiceCategoryNotFound_Returns404() throws Exception {
            String createRequest = """
                    {
                        "serviceCategoryId": 99999,
                        "description": "Non-existent category",
                        "quantity": 5.0,
                        "requiredDate": "2025-02-15"
                    }
                    """;

            mockMvc.perform(post(PURCHASE_REQUESTS_URL + "/service")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("should return 401 without authentication")
        void createServicePurchaseRequest_WithoutAuth_Returns401() throws Exception {
            String createRequest = """
                    {
                        "serviceCategoryId": 1,
                        "description": "Unauthorized",
                        "quantity": 5.0,
                        "requiredDate": "2025-02-15"
                    }
                    """;

            mockMvc.perform(post(PURCHASE_REQUESTS_URL + "/service")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isUnauthorized());
        }
    }

    // ==========================================================================
    // POST /api/purchase-requests/material - Create Material Purchase Request
    // ==========================================================================

    @Nested
    @DisplayName("POST /api/purchase-requests/material - Create Material Purchase Request")
    class CreateMaterialPurchaseRequestTests {

        @BeforeEach
        void setUpMaterial() {
            insertTestMaterial(1L, "Steel Plate 10mm", "EA");
        }

        @Test
        @DisplayName("should return 201 with command result when Admin creates material purchase request")
        void createMaterialPurchaseRequest_AsAdmin_Returns201() throws Exception {
            String createRequest = """
                    {
                        "projectId": 1,
                        "materialId": 1,
                        "description": "Steel plates for project",
                        "quantity": 50.0,
                        "uom": "EA",
                        "requiredDate": "2025-02-15"
                    }
                    """;

            mockMvc.perform(post(PURCHASE_REQUESTS_URL + "/material")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isCreated())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").isNumber())
                    .andExpect(jsonPath("$.data.message").value("Purchase request created successfully"));
        }

        @Test
        @DisplayName("should return 201 when Finance creates material purchase request")
        void createMaterialPurchaseRequest_AsFinance_Returns201() throws Exception {
            String createRequest = """
                    {
                        "materialId": 1,
                        "description": "Material purchasing",
                        "quantity": 25.0,
                        "requiredDate": "2025-02-15"
                    }
                    """;

            mockMvc.perform(post(PURCHASE_REQUESTS_URL + "/material")
                            .header("Authorization", "Bearer " + financeToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true));
        }

        @Test
        @DisplayName("should return 201 when Production creates material purchase request")
        void createMaterialPurchaseRequest_AsProduction_Returns201() throws Exception {
            String createRequest = """
                    {
                        "projectId": 1,
                        "materialId": 1,
                        "description": "Production materials",
                        "quantity": 100.0,
                        "requiredDate": "2025-02-15"
                    }
                    """;

            mockMvc.perform(post(PURCHASE_REQUESTS_URL + "/material")
                            .header("Authorization", "Bearer " + productionToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true));
        }

        @Test
        @DisplayName("should return 403 when Sales creates material purchase request")
        void createMaterialPurchaseRequest_AsSales_Returns403() throws Exception {
            String createRequest = """
                    {
                        "materialId": 1,
                        "description": "Unauthorized request",
                        "quantity": 5.0,
                        "requiredDate": "2025-02-15"
                    }
                    """;

            mockMvc.perform(post(PURCHASE_REQUESTS_URL + "/material")
                            .header("Authorization", "Bearer " + salesToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 400 when materialId is missing")
        void createMaterialPurchaseRequest_MissingMaterialId_Returns400() throws Exception {
            String createRequest = """
                    {
                        "description": "Missing material",
                        "quantity": 5.0,
                        "requiredDate": "2025-02-15"
                    }
                    """;

            mockMvc.perform(post(PURCHASE_REQUESTS_URL + "/material")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 400 when description is missing")
        void createMaterialPurchaseRequest_MissingDescription_Returns400() throws Exception {
            String createRequest = """
                    {
                        "materialId": 1,
                        "quantity": 5.0,
                        "requiredDate": "2025-02-15"
                    }
                    """;

            mockMvc.perform(post(PURCHASE_REQUESTS_URL + "/material")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 400 when quantity is zero or negative")
        void createMaterialPurchaseRequest_InvalidQuantity_Returns400() throws Exception {
            String createRequest = """
                    {
                        "materialId": 1,
                        "description": "Invalid quantity",
                        "quantity": 0,
                        "requiredDate": "2025-02-15"
                    }
                    """;

            mockMvc.perform(post(PURCHASE_REQUESTS_URL + "/material")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 404 when material not found")
        void createMaterialPurchaseRequest_MaterialNotFound_Returns404() throws Exception {
            String createRequest = """
                    {
                        "materialId": 99999,
                        "description": "Non-existent material",
                        "quantity": 5.0,
                        "requiredDate": "2025-02-15"
                    }
                    """;

            mockMvc.perform(post(PURCHASE_REQUESTS_URL + "/material")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("should return 401 without authentication")
        void createMaterialPurchaseRequest_WithoutAuth_Returns401() throws Exception {
            String createRequest = """
                    {
                        "materialId": 1,
                        "description": "Unauthorized",
                        "quantity": 5.0,
                        "requiredDate": "2025-02-15"
                    }
                    """;

            mockMvc.perform(post(PURCHASE_REQUESTS_URL + "/material")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isUnauthorized());
        }
    }

    // ==========================================================================
    // GET /api/purchase-requests - List Purchase Requests
    // ==========================================================================

    @Nested
    @DisplayName("GET /api/purchase-requests - List Purchase Requests")
    class ListPurchaseRequestsTests {

        @BeforeEach
        void setUpPurchaseRequests() {
            insertTestPurchaseRequest(100L, 1L, 1L, "PR-TEST-000001", "CNC components");
            insertTestPurchaseRequest(101L, 1L, 1L, "PR-TEST-000002", "Laser cutting");
            insertTestPurchaseRequest(102L, null, 1L, "PR-TEST-000003", "General purchase");
        }

        @Test
        @DisplayName("should return 200 with paginated list for Admin")
        void listPurchaseRequests_AsAdmin_Returns200() throws Exception {
            mockMvc.perform(get(PURCHASE_REQUESTS_URL)
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content", hasSize(greaterThanOrEqualTo(3))))
                    .andExpect(jsonPath("$.data.content[0].id").isNumber())
                    .andExpect(jsonPath("$.data.content[0].requestNumber").isString());
        }

        @Test
        @DisplayName("should return 200 for Finance (read access)")
        void listPurchaseRequests_AsFinance_Returns200() throws Exception {
            mockMvc.perform(get(PURCHASE_REQUESTS_URL)
                            .header("Authorization", "Bearer " + financeToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }

        @Test
        @DisplayName("should return 200 for Production (read access)")
        void listPurchaseRequests_AsProduction_Returns200() throws Exception {
            mockMvc.perform(get(PURCHASE_REQUESTS_URL)
                            .header("Authorization", "Bearer " + productionToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }

        @Test
        @DisplayName("should return 200 for Sales (read access)")
        void listPurchaseRequests_AsSales_Returns200() throws Exception {
            mockMvc.perform(get(PURCHASE_REQUESTS_URL)
                            .header("Authorization", "Bearer " + salesToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }

        @Test
        @DisplayName("should filter by project ID")
        void listPurchaseRequests_FilterByProject_ReturnsMatchingRequests() throws Exception {
            mockMvc.perform(get(PURCHASE_REQUESTS_URL)
                            .header("Authorization", "Bearer " + adminToken)
                            .param("projectId", "1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.content", hasSize(greaterThanOrEqualTo(2))));
        }

        @Test
        @DisplayName("should filter by status")
        void listPurchaseRequests_FilterByStatus_ReturnsMatchingRequests() throws Exception {
            mockMvc.perform(get(PURCHASE_REQUESTS_URL)
                            .header("Authorization", "Bearer " + adminToken)
                            .param("status", "DRAFT"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.content", hasSize(greaterThanOrEqualTo(1))));
        }

        @Test
        @DisplayName("should support pagination")
        void listPurchaseRequests_WithPagination_ReturnsCorrectPage() throws Exception {
            mockMvc.perform(get(PURCHASE_REQUESTS_URL)
                            .header("Authorization", "Bearer " + adminToken)
                            .param("page", "0")
                            .param("size", "10"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.pageable.pageNumber").value(0))
                    .andExpect(jsonPath("$.data.pageable.pageSize").value(10));
        }

        @Test
        @DisplayName("should return 401 without authentication")
        void listPurchaseRequests_WithoutAuth_Returns401() throws Exception {
            mockMvc.perform(get(PURCHASE_REQUESTS_URL))
                    .andExpect(status().isUnauthorized());
        }
    }

    // ==========================================================================
    // GET /api/purchase-requests/{id} - Get Purchase Request by ID
    // ==========================================================================

    @Nested
    @DisplayName("GET /api/purchase-requests/{id} - Get Purchase Request by ID")
    class GetPurchaseRequestByIdTests {

        @BeforeEach
        void setUpPurchaseRequest() {
            insertTestPurchaseRequest(100L, 1L, 1L, "PR-2025-000100", "Test purchase request");
        }

        @Test
        @DisplayName("should return 200 with purchase request details for Admin")
        void getPurchaseRequest_AsAdmin_Returns200() throws Exception {
            mockMvc.perform(get(PURCHASE_REQUESTS_URL + "/100")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").value(100))
                    .andExpect(jsonPath("$.data.requestNumber").value("PR-2025-000100"))
                    .andExpect(jsonPath("$.data.serviceCategoryName").isString());
        }

        @Test
        @DisplayName("should return 404 for non-existent purchase request")
        void getPurchaseRequest_NonExistent_Returns404() throws Exception {
            mockMvc.perform(get(PURCHASE_REQUESTS_URL + "/99999")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("should return 401 without authentication")
        void getPurchaseRequest_WithoutAuth_Returns401() throws Exception {
            mockMvc.perform(get(PURCHASE_REQUESTS_URL + "/100"))
                    .andExpect(status().isUnauthorized());
        }
    }

    // ==========================================================================
    // PUT /api/purchase-requests/{id} - Update Purchase Request
    // ==========================================================================

    @Nested
    @DisplayName("PUT /api/purchase-requests/{id} - Update Purchase Request")
    class UpdatePurchaseRequestTests {

        @BeforeEach
        void setUpPurchaseRequest() {
            insertTestPurchaseRequest(200L, 1L, 1L, "PR-2025-000200", "Original description");
        }

        @Test
        @DisplayName("should return 200 with command result when Admin updates purchase request")
        void updatePurchaseRequest_AsAdmin_Returns200() throws Exception {
            String updateRequest = """
                    {
                        "description": "Updated description",
                        "quantity": 15.0,
                        "requiredDate": "2025-03-01"
                    }
                    """;

            mockMvc.perform(put(PURCHASE_REQUESTS_URL + "/200")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(updateRequest))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").value(200))
                    .andExpect(jsonPath("$.data.message").value("Purchase request updated successfully"));
        }

        @Test
        @DisplayName("should return 403 when Sales updates purchase request")
        void updatePurchaseRequest_AsSales_Returns403() throws Exception {
            String updateRequest = """
                    {
                        "description": "Sales update",
                        "quantity": 10.0,
                        "requiredDate": "2025-03-01"
                    }
                    """;

            mockMvc.perform(put(PURCHASE_REQUESTS_URL + "/200")
                            .header("Authorization", "Bearer " + salesToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(updateRequest))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 404 for non-existent purchase request")
        void updatePurchaseRequest_NonExistent_Returns404() throws Exception {
            String updateRequest = """
                    {
                        "description": "Updated",
                        "quantity": 10.0,
                        "requiredDate": "2025-03-01"
                    }
                    """;

            mockMvc.perform(put(PURCHASE_REQUESTS_URL + "/99999")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(updateRequest))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("should return 401 without authentication")
        void updatePurchaseRequest_WithoutAuth_Returns401() throws Exception {
            String updateRequest = """
                    {
                        "description": "Updated",
                        "quantity": 10.0,
                        "requiredDate": "2025-03-01"
                    }
                    """;

            mockMvc.perform(put(PURCHASE_REQUESTS_URL + "/200")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(updateRequest))
                    .andExpect(status().isUnauthorized());
        }
    }

    // ==========================================================================
    // POST /api/purchase-requests/{id}/send-rfq - Send RFQ to Vendors
    // ==========================================================================

    @Nested
    @DisplayName("POST /api/purchase-requests/{id}/send-rfq - Send RFQ to Vendors")
    class SendRfqTests {

        @BeforeEach
        void setUpData() {
            insertTestVendorCompany(50L, "Vendor A");
            insertTestVendorCompany(51L, "Vendor B");
            insertTestPurchaseRequest(300L, 1L, 1L, "PR-2025-000300", "RFQ test request");
        }

        @Test
        @DisplayName("should return 200 when sending RFQ to vendors")
        void sendRfq_AsAdmin_Returns200() throws Exception {
            String sendRfqRequest = """
                    {
                        "vendorIds": [50, 51]
                    }
                    """;

            mockMvc.perform(post(PURCHASE_REQUESTS_URL + "/300/send-rfq")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(sendRfqRequest))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.message").value(containsString("RFQ sent")));
        }

        @Test
        @DisplayName("should return 400 when vendor list is empty")
        void sendRfq_EmptyVendorList_Returns400() throws Exception {
            String sendRfqRequest = """
                    {
                        "vendorIds": []
                    }
                    """;

            mockMvc.perform(post(PURCHASE_REQUESTS_URL + "/300/send-rfq")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(sendRfqRequest))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 200 when adding vendors in RFQ_SENT status")
        void sendRfq_InRfqSent_Returns200() throws Exception {
            // Update status to RFQ_SENT (allowed - adding more vendors)
            jdbcTemplate.update("UPDATE purchase_requests SET status = 'RFQ_SENT' WHERE id = 300");

            String sendRfqRequest = """
                    {
                        "vendorIds": [50, 51]
                    }
                    """;

            mockMvc.perform(post(PURCHASE_REQUESTS_URL + "/300/send-rfq")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(sendRfqRequest))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("should return 400 when purchase request in VENDOR_SELECTED status")
        void sendRfq_InVendorSelected_Returns400() throws Exception {
            // Update status to VENDOR_SELECTED (not allowed)
            jdbcTemplate.update("UPDATE purchase_requests SET status = 'VENDOR_SELECTED' WHERE id = 300");

            String sendRfqRequest = """
                    {
                        "vendorIds": [50, 51]
                    }
                    """;

            mockMvc.perform(post(PURCHASE_REQUESTS_URL + "/300/send-rfq")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(sendRfqRequest))
                    .andExpect(status().isBadRequest());
        }
    }

    // ==========================================================================
    // DELETE /api/purchase-requests/{id} - Cancel Purchase Request
    // ==========================================================================

    @Nested
    @DisplayName("DELETE /api/purchase-requests/{id} - Cancel Purchase Request")
    class CancelPurchaseRequestTests {

        @BeforeEach
        void setUpPurchaseRequest() {
            insertTestPurchaseRequest(400L, 1L, 1L, "PR-2025-000400", "Request to cancel");
        }

        @Test
        @DisplayName("should return 204 when Admin cancels purchase request")
        void cancelPurchaseRequest_AsAdmin_Returns204() throws Exception {
            mockMvc.perform(delete(PURCHASE_REQUESTS_URL + "/400")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isNoContent());
        }

        @Test
        @DisplayName("should return 403 when Sales cancels purchase request")
        void cancelPurchaseRequest_AsSales_Returns403() throws Exception {
            mockMvc.perform(delete(PURCHASE_REQUESTS_URL + "/400")
                            .header("Authorization", "Bearer " + salesToken))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 404 for non-existent purchase request")
        void cancelPurchaseRequest_NonExistent_Returns404() throws Exception {
            mockMvc.perform(delete(PURCHASE_REQUESTS_URL + "/99999")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("should return 401 without authentication")
        void cancelPurchaseRequest_WithoutAuth_Returns401() throws Exception {
            mockMvc.perform(delete(PURCHASE_REQUESTS_URL + "/400"))
                    .andExpect(status().isUnauthorized());
        }
    }

    // ==========================================================================
    // Helper Methods for Test Data Setup
    // ==========================================================================

    private void insertTestServiceCategory(Long id, String name) {
        jdbcTemplate.update(
                "INSERT INTO service_categories (id, name, is_active, created_at, updated_at) " +
                        "VALUES (?, ?, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) " +
                        "ON CONFLICT (id) DO NOTHING",
                id, name
        );
    }

    private void insertTestCustomerCompany(Long id, String name) {
        jdbcTemplate.update(
                "INSERT INTO companies (id, name, is_active, created_at, updated_at) " +
                        "VALUES (?, ?, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) " +
                        "ON CONFLICT (id) DO NOTHING",
                id, name
        );
        jdbcTemplate.update(
                "INSERT INTO company_roles (company_id, role_type, created_at) " +
                        "VALUES (?, 'CUSTOMER', CURRENT_TIMESTAMP) " +
                        "ON CONFLICT (company_id, role_type) DO NOTHING",
                id
        );
    }

    private void insertTestVendorCompany(Long id, String name) {
        jdbcTemplate.update(
                "INSERT INTO companies (id, name, is_active, created_at, updated_at) " +
                        "VALUES (?, ?, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) " +
                        "ON CONFLICT (id) DO NOTHING",
                id, name
        );
        jdbcTemplate.update(
                "INSERT INTO company_roles (company_id, role_type, created_at) " +
                        "VALUES (?, 'VENDOR', CURRENT_TIMESTAMP) " +
                        "ON CONFLICT (company_id, role_type) DO NOTHING",
                id
        );
    }

    private void insertTestProject(Long id, String jobCode, Long customerId, Long ownerId) {
        jdbcTemplate.update(
                "INSERT INTO projects (id, job_code, project_name, customer_company_id, internal_owner_id, " +
                        "due_date, status, created_by_id, created_at, updated_at) " +
                        "VALUES (?, ?, 'Test Project', ?, ?, CURRENT_DATE + 30, 'ACTIVE', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) " +
                        "ON CONFLICT (id) DO NOTHING",
                id, jobCode, customerId, ownerId, ownerId
        );
    }

    private void insertTestPurchaseRequest(Long id, Long projectId, Long serviceCategoryId, String requestNumber, String description) {
        jdbcTemplate.update(
                "INSERT INTO purchase_requests (id, project_id, service_category_id, request_number, " +
                        "description, quantity, required_date, status, created_by_id, created_at, updated_at) " +
                        "VALUES (?, ?, ?, ?, ?, 10.0, CURRENT_DATE + 30, 'DRAFT', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) " +
                        "ON CONFLICT (id) DO NOTHING",
                id, projectId, serviceCategoryId, requestNumber, description
        );
    }

    private void insertTestMaterial(Long id, String name, String unit) {
        // Insert material category first
        jdbcTemplate.update(
                "INSERT INTO material_categories (id, name, is_active, created_at, updated_at) " +
                        "VALUES (1, 'Test Category', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) " +
                        "ON CONFLICT (id) DO NOTHING"
        );
        String sku = "TEST-MAT-" + id;
        jdbcTemplate.update(
                "INSERT INTO materials (id, sku, name, category_id, unit, is_active, created_at, updated_at) " +
                        "VALUES (?, ?, ?, 1, ?, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) " +
                        "ON CONFLICT (id) DO NOTHING",
                id, sku, name, unit
        );
    }
}
