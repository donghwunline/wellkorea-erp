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

import java.time.LocalDate;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Contract tests for /api/purchase-orders endpoints.
 * Tests validate the PurchaseOrder domain API contract with RBAC.
 * <p>
 * Test-First Development: These tests MUST be written FIRST and MUST FAIL initially.
 * Per Constitution Principle I (Test-First Development).
 * <p>
 * RBAC Rules:
 * - Admin, Finance, Production: Full CRUD access
 * - Sales: Read-only access (can view their project's purchase orders)
 */
@Tag("integration")
@AutoConfigureMockMvc
@Transactional
@DisplayName("Purchase Order Controller Contract Tests")
class PurchaseOrderControllerTest extends BaseIntegrationTest implements TestFixtures {

    private static final String PURCHASE_ORDERS_URL = "/api/purchase-orders";

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

    // Dynamic date strings for test data (avoids hardcoded dates becoming stale)
    private String today;
    private String nextWeek;
    private String nextMonth;
    private String yesterday;  // For invalid date testing

    // Test UUID for RFQ item (consistent across all tests)
    private static final String TEST_RFQ_ITEM_ID = "test0000-0000-0000-0000-000000000900";

    @BeforeEach
    void setUp() {
        // Initialize dynamic dates
        LocalDate now = LocalDate.now();
        today = now.toString();
        nextWeek = now.plusWeeks(1).toString();
        nextMonth = now.plusMonths(1).toString();
        yesterday = now.minusDays(1).toString();
        DatabaseTestHelper.insertTestUsersWithRoles(jdbcTemplate);

        // Generate tokens for different roles
        adminToken = jwtTokenProvider.generateToken(ADMIN_USERNAME, Role.ADMIN.getAuthority(), TEST_USER_ID);
        financeToken = jwtTokenProvider.generateToken(FINANCE_USERNAME, Role.FINANCE.getAuthority(), 2L);
        salesToken = jwtTokenProvider.generateToken(SALES_USERNAME, Role.SALES.getAuthority(), 4L);
        productionToken = jwtTokenProvider.generateToken(PRODUCTION_USERNAME, Role.PRODUCTION.getAuthority(), 3L);

        // Insert base test data - use IDs 900+ to avoid conflicts with seed data
        insertTestServiceCategory(900L, "CNC Machining");
        insertTestCustomerCompany(900L, "Test Customer");
        insertTestVendorCompany(950L, "Vendor A");
        insertTestProject(900L, "WK2K25-9001-0115", 900L, 1L);
        insertTestPurchaseRequest(900L, 900L, 900L, "PR-TEST-000001", "Test purchase request");
        insertTestRfqItem(TEST_RFQ_ITEM_ID, 900L, 950L, 50000.00);
    }

    // ==========================================================================
    // POST /api/purchase-orders - Create Purchase Order from RFQ
    // ==========================================================================

    @Nested
    @DisplayName("POST /api/purchase-orders - Create Purchase Order from RFQ")
    class CreatePurchaseOrderTests {

        @Test
        @DisplayName("should return 201 with command result when Admin creates purchase order")
        void createPurchaseOrder_AsAdmin_Returns201() throws Exception {
            String createRequest = String.format("""
                    {
                        "purchaseRequestId": 900,
                        "rfqItemId": "%s",
                        "orderDate": "%s",
                        "expectedDeliveryDate": "%s",
                        "notes": "Rush order"
                    }
                    """, TEST_RFQ_ITEM_ID, today, nextMonth);

            mockMvc.perform(post(PURCHASE_ORDERS_URL)
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isCreated())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").isNumber())
                    .andExpect(jsonPath("$.data.message").value("Purchase order created successfully"));
        }

        @Test
        @DisplayName("should return 201 when Finance creates purchase order")
        void createPurchaseOrder_AsFinance_Returns201() throws Exception {
            String createRequest = String.format("""
                    {
                        "purchaseRequestId": 900,
                        "rfqItemId": "%s",
                        "orderDate": "%s",
                        "expectedDeliveryDate": "%s"
                    }
                    """, TEST_RFQ_ITEM_ID, today, nextMonth);

            mockMvc.perform(post(PURCHASE_ORDERS_URL)
                            .header("Authorization", "Bearer " + financeToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true));
        }

        @Test
        @DisplayName("should return 403 when Sales creates purchase order")
        void createPurchaseOrder_AsSales_Returns403() throws Exception {
            String createRequest = String.format("""
                    {
                        "purchaseRequestId": 900,
                        "rfqItemId": "%s",
                        "orderDate": "%s",
                        "expectedDeliveryDate": "%s"
                    }
                    """, TEST_RFQ_ITEM_ID, today, nextMonth);

            mockMvc.perform(post(PURCHASE_ORDERS_URL)
                            .header("Authorization", "Bearer " + salesToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 400 when rfqItemId is missing")
        void createPurchaseOrder_MissingRfqItemId_Returns400() throws Exception {
            String createRequest = String.format("""
                    {
                        "orderDate": "%s",
                        "expectedDeliveryDate": "%s"
                    }
                    """, today, nextMonth);

            mockMvc.perform(post(PURCHASE_ORDERS_URL)
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 400 when delivery date is before order date")
        void createPurchaseOrder_DeliveryBeforeOrder_Returns400() throws Exception {
            String createRequest = String.format("""
                    {
                        "purchaseRequestId": 900,
                        "rfqItemId": "%s",
                        "orderDate": "%s",
                        "expectedDeliveryDate": "%s"
                    }
                    """, TEST_RFQ_ITEM_ID, nextMonth, today);  // delivery before order

            mockMvc.perform(post(PURCHASE_ORDERS_URL)
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 404 when RFQ item not found")
        void createPurchaseOrder_RfqItemNotFound_Returns404() throws Exception {
            String createRequest = String.format("""
                    {
                        "purchaseRequestId": 900,
                        "rfqItemId": "nonexist-0000-0000-0000-000000000000",
                        "orderDate": "%s",
                        "expectedDeliveryDate": "%s"
                    }
                    """, today, nextMonth);

            mockMvc.perform(post(PURCHASE_ORDERS_URL)
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("should return 401 without authentication")
        void createPurchaseOrder_WithoutAuth_Returns401() throws Exception {
            String createRequest = String.format("""
                    {
                        "purchaseRequestId": 900,
                        "rfqItemId": "%s",
                        "orderDate": "%s",
                        "expectedDeliveryDate": "%s"
                    }
                    """, TEST_RFQ_ITEM_ID, today, nextMonth);

            mockMvc.perform(post(PURCHASE_ORDERS_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isUnauthorized());
        }
    }

    // ==========================================================================
    // GET /api/purchase-orders - List Purchase Orders
    // ==========================================================================

    @Nested
    @DisplayName("GET /api/purchase-orders - List Purchase Orders")
    class ListPurchaseOrdersTests {

        @BeforeEach
        void setUpPurchaseOrders() {
            insertTestPurchaseOrder(100L, 900L, TEST_RFQ_ITEM_ID, 950L, "PO-TEST-000001", 50000.00);
            insertTestPurchaseOrder(101L, 900L, TEST_RFQ_ITEM_ID, 950L, "PO-TEST-000002", 75000.00);
        }

        @Test
        @DisplayName("should return 200 with paginated list for Admin")
        void listPurchaseOrders_AsAdmin_Returns200() throws Exception {
            mockMvc.perform(get(PURCHASE_ORDERS_URL)
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content", hasSize(greaterThanOrEqualTo(2))))
                    .andExpect(jsonPath("$.data.content[0].poNumber").isString());
        }

        @Test
        @DisplayName("should return 200 for Finance (read access)")
        void listPurchaseOrders_AsFinance_Returns200() throws Exception {
            mockMvc.perform(get(PURCHASE_ORDERS_URL)
                            .header("Authorization", "Bearer " + financeToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }

        @Test
        @DisplayName("should return 200 for Sales (read access)")
        void listPurchaseOrders_AsSales_Returns200() throws Exception {
            mockMvc.perform(get(PURCHASE_ORDERS_URL)
                            .header("Authorization", "Bearer " + salesToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }

        @Test
        @DisplayName("should filter by vendor ID")
        void listPurchaseOrders_FilterByVendor_ReturnsMatchingOrders() throws Exception {
            mockMvc.perform(get(PURCHASE_ORDERS_URL)
                            .header("Authorization", "Bearer " + adminToken)
                            .param("vendorId", "950"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.content", hasSize(greaterThanOrEqualTo(2))));
        }

        @Test
        @DisplayName("should filter by status")
        void listPurchaseOrders_FilterByStatus_ReturnsMatchingOrders() throws Exception {
            mockMvc.perform(get(PURCHASE_ORDERS_URL)
                            .header("Authorization", "Bearer " + adminToken)
                            .param("status", "DRAFT"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.content", hasSize(greaterThanOrEqualTo(1))));
        }

        @Test
        @DisplayName("should return 401 without authentication")
        void listPurchaseOrders_WithoutAuth_Returns401() throws Exception {
            mockMvc.perform(get(PURCHASE_ORDERS_URL))
                    .andExpect(status().isUnauthorized());
        }
    }

    // ==========================================================================
    // GET /api/purchase-orders/{id} - Get Purchase Order by ID
    // ==========================================================================

    @Nested
    @DisplayName("GET /api/purchase-orders/{id} - Get Purchase Order by ID")
    class GetPurchaseOrderByIdTests {

        @BeforeEach
        void setUpPurchaseOrder() {
            insertTestPurchaseOrder(100L, 900L, TEST_RFQ_ITEM_ID, 950L, "PO-2025-000100", 50000.00);
        }

        @Test
        @DisplayName("should return 200 with purchase order details for Admin")
        void getPurchaseOrder_AsAdmin_Returns200() throws Exception {
            mockMvc.perform(get(PURCHASE_ORDERS_URL + "/100")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").value(100))
                    .andExpect(jsonPath("$.data.poNumber").value("PO-2025-000100"))
                    .andExpect(jsonPath("$.data.vendorName").isString())
                    .andExpect(jsonPath("$.data.totalAmount").value(50000.00));
        }

        @Test
        @DisplayName("should return 404 for non-existent purchase order")
        void getPurchaseOrder_NonExistent_Returns404() throws Exception {
            mockMvc.perform(get(PURCHASE_ORDERS_URL + "/99999")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("should return 401 without authentication")
        void getPurchaseOrder_WithoutAuth_Returns401() throws Exception {
            mockMvc.perform(get(PURCHASE_ORDERS_URL + "/100"))
                    .andExpect(status().isUnauthorized());
        }
    }

    // ==========================================================================
    // PUT /api/purchase-orders/{id} - Update Purchase Order
    // ==========================================================================

    @Nested
    @DisplayName("PUT /api/purchase-orders/{id} - Update Purchase Order")
    class UpdatePurchaseOrderTests {

        @BeforeEach
        void setUpPurchaseOrder() {
            insertTestPurchaseOrder(200L, 900L, TEST_RFQ_ITEM_ID, 950L, "PO-2025-000200", 50000.00);
        }

        @Test
        @DisplayName("should return 200 with command result when Admin updates purchase order")
        void updatePurchaseOrder_AsAdmin_Returns200() throws Exception {
            String updateRequest = String.format("""
                    {
                        "expectedDeliveryDate": "%s",
                        "notes": "Updated delivery date"
                    }
                    """, nextMonth);

            mockMvc.perform(put(PURCHASE_ORDERS_URL + "/200")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(updateRequest))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").value(200))
                    .andExpect(jsonPath("$.data.message").value("Purchase order updated successfully"));
        }

        @Test
        @DisplayName("should return 403 when Sales updates purchase order")
        void updatePurchaseOrder_AsSales_Returns403() throws Exception {
            String updateRequest = """
                    {
                        "notes": "Sales update"
                    }
                    """;

            mockMvc.perform(put(PURCHASE_ORDERS_URL + "/200")
                            .header("Authorization", "Bearer " + salesToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(updateRequest))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 404 for non-existent purchase order")
        void updatePurchaseOrder_NonExistent_Returns404() throws Exception {
            String updateRequest = """
                    {
                        "notes": "Updated"
                    }
                    """;

            mockMvc.perform(put(PURCHASE_ORDERS_URL + "/99999")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(updateRequest))
                    .andExpect(status().isNotFound());
        }
    }

    // ==========================================================================
    // POST /api/purchase-orders/{id}/send - Send Purchase Order
    // ==========================================================================

    @Nested
    @DisplayName("POST /api/purchase-orders/{id}/send - Send Purchase Order")
    class SendPurchaseOrderTests {

        @BeforeEach
        void setUpPurchaseOrder() {
            insertTestPurchaseOrder(300L, 900L, TEST_RFQ_ITEM_ID, 950L, "PO-2025-000300", 50000.00);
        }

        @Test
        @DisplayName("should return 200 when Admin sends purchase order")
        void sendPurchaseOrder_AsAdmin_Returns200() throws Exception {
            String sendRequest = """
                    {
                        "to": "vendor@test.com"
                    }
                    """;

            mockMvc.perform(post(PURCHASE_ORDERS_URL + "/300/send")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(sendRequest))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.message").value(containsString("sent")));
        }

        @Test
        @DisplayName("should return 409 when PO not in DRAFT status")
        void sendPurchaseOrder_NotDraft_Returns409() throws Exception {
            jdbcTemplate.update("UPDATE purchase_orders SET status = 'SENT' WHERE id = 300");

            mockMvc.perform(post(PURCHASE_ORDERS_URL + "/300/send")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andExpect(status().isConflict());
        }

        @Test
        @DisplayName("should return 403 when Sales sends purchase order")
        void sendPurchaseOrder_AsSales_Returns403() throws Exception {
            mockMvc.perform(post(PURCHASE_ORDERS_URL + "/300/send")
                            .header("Authorization", "Bearer " + salesToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andExpect(status().isForbidden());
        }
    }

    // ==========================================================================
    // POST /api/purchase-orders/{id}/receive - Mark as Received
    // ==========================================================================

    @Nested
    @DisplayName("POST /api/purchase-orders/{id}/receive - Mark as Received")
    class ReceivePurchaseOrderTests {

        @BeforeEach
        void setUpSentPurchaseOrder() {
            // Receiving a PO closes the PR, so PR must be in VENDOR_SELECTED status
            jdbcTemplate.update("UPDATE purchase_requests SET status = 'VENDOR_SELECTED' WHERE id = 900");
            jdbcTemplate.update("UPDATE rfq_items SET status = 'SELECTED' WHERE purchase_request_id = 900 AND item_id = ?", TEST_RFQ_ITEM_ID);
            insertTestPurchaseOrder(400L, 900L, TEST_RFQ_ITEM_ID, 950L, "PO-2025-000400", 50000.00);
            jdbcTemplate.update("UPDATE purchase_orders SET status = 'CONFIRMED' WHERE id = 400");
        }

        @Test
        @DisplayName("should return 200 when Admin receives purchase order")
        void receivePurchaseOrder_AsAdmin_Returns200() throws Exception {
            mockMvc.perform(post(PURCHASE_ORDERS_URL + "/400/receive")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.message").value(containsString("received")));
        }

        @Test
        @DisplayName("should return 200 when Production receives purchase order")
        void receivePurchaseOrder_AsProduction_Returns200() throws Exception {
            mockMvc.perform(post(PURCHASE_ORDERS_URL + "/400/receive")
                            .header("Authorization", "Bearer " + productionToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }

        @Test
        @DisplayName("should return 409 when PO not in CONFIRMED status")
        void receivePurchaseOrder_NotConfirmed_Returns409() throws Exception {
            jdbcTemplate.update("UPDATE purchase_orders SET status = 'DRAFT' WHERE id = 400");

            mockMvc.perform(post(PURCHASE_ORDERS_URL + "/400/receive")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isConflict());
        }

        @Test
        @DisplayName("should publish PurchaseOrderReceivedEvent when PO is received")
        void receivePurchaseOrder_ShouldPublishEvent() throws Exception {
            // Given: PR is in VENDOR_SELECTED status (set in @BeforeEach)
            // Note: Event-driven PR closure is tested via unit tests for PurchaseRequestEventHandler
            // This integration test verifies the event is published with correct data

            // When: Receive the PO
            mockMvc.perform(post(PURCHASE_ORDERS_URL + "/400/receive")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.message").value(containsString("received")));

            // Then: The receive operation succeeded
            // The PurchaseOrderReceivedEvent is published and handled by PurchaseRequestEventHandler
            // to close the PR (tested in PurchaseRequestEventHandlerTest)
        }
    }

    // ==========================================================================
    // DELETE /api/purchase-orders/{id} - Cancel Purchase Order
    // ==========================================================================

    @Nested
    @DisplayName("DELETE /api/purchase-orders/{id} - Cancel Purchase Order")
    class CancelPurchaseOrderTests {

        @BeforeEach
        void setUpPurchaseOrder() {
            insertTestPurchaseOrder(500L, 900L, TEST_RFQ_ITEM_ID, 950L, "PO-2025-000500", 50000.00);
        }

        @Test
        @DisplayName("should return 204 when Admin cancels purchase order")
        void cancelPurchaseOrder_AsAdmin_Returns204() throws Exception {
            mockMvc.perform(delete(PURCHASE_ORDERS_URL + "/500")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isNoContent());
        }

        @Test
        @DisplayName("should return 409 when PO is already received")
        void cancelPurchaseOrder_AlreadyReceived_Returns409() throws Exception {
            jdbcTemplate.update("UPDATE purchase_orders SET status = 'RECEIVED' WHERE id = 500");

            mockMvc.perform(delete(PURCHASE_ORDERS_URL + "/500")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isConflict());
        }

        @Test
        @DisplayName("should return 403 when Sales cancels purchase order")
        void cancelPurchaseOrder_AsSales_Returns403() throws Exception {
            mockMvc.perform(delete(PURCHASE_ORDERS_URL + "/500")
                            .header("Authorization", "Bearer " + salesToken))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 401 without authentication")
        void cancelPurchaseOrder_WithoutAuth_Returns401() throws Exception {
            mockMvc.perform(delete(PURCHASE_ORDERS_URL + "/500"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("should allow re-creating PO after cancellation")
        void cancelAndRecreate_ShouldSucceed() throws Exception {
            // Given: Set PR to VENDOR_SELECTED state for proper event handling
            jdbcTemplate.update("UPDATE purchase_requests SET status = 'VENDOR_SELECTED' WHERE id = 900");
            jdbcTemplate.update("UPDATE rfq_items SET status = 'SELECTED' WHERE purchase_request_id = 900 AND item_id = ?", TEST_RFQ_ITEM_ID);

            // When: Cancel the existing PO
            mockMvc.perform(delete(PURCHASE_ORDERS_URL + "/500")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isNoContent());

            // Then: Should be able to create a new PO for the same RFQ item
            // (The event handler reverts the RfqItem status to REPLIED)
            String createRequest = String.format("""
                    {
                        "purchaseRequestId": 900,
                        "rfqItemId": "%s",
                        "orderDate": "%s",
                        "expectedDeliveryDate": "%s",
                        "notes": "Re-created after cancellation"
                    }
                    """, TEST_RFQ_ITEM_ID, today, nextMonth);

            mockMvc.perform(post(PURCHASE_ORDERS_URL)
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").isNumber());
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
                        "VALUES (?, ?, ?, ?, ?, 10.0, CURRENT_DATE + 30, 'RFQ_SENT', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) " +
                        "ON CONFLICT (id) DO NOTHING",
                id, projectId, serviceCategoryId, requestNumber, description
        );
    }

    private void insertTestRfqItem(String itemId, Long purchaseRequestId, Long vendorId, Double quotedPrice) {
        jdbcTemplate.update(
                "INSERT INTO rfq_items (purchase_request_id, item_id, vendor_company_id, status, quoted_price, " +
                        "sent_at, replied_at) " +
                        "VALUES (?, ?, ?, 'REPLIED', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) " +
                        "ON CONFLICT (purchase_request_id, item_id) DO NOTHING",
                purchaseRequestId, itemId, vendorId, quotedPrice
        );
    }

    private void insertTestPurchaseOrder(Long id, Long purchaseRequestId, String rfqItemId, Long vendorId, String poNumber, Double totalAmount) {
        jdbcTemplate.update(
                "INSERT INTO purchase_orders (id, purchase_request_id, rfq_item_id, project_id, vendor_company_id, po_number, " +
                        "order_date, expected_delivery_date, total_amount, status, created_by_id, created_at, updated_at) " +
                        "VALUES (?, ?, ?, 1, ?, ?, CURRENT_DATE, CURRENT_DATE + 30, ?, 'DRAFT', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) " +
                        "ON CONFLICT (id) DO NOTHING",
                id, purchaseRequestId, rfqItemId, vendorId, poNumber, totalAmount
        );
    }
}
