package com.wellkorea.backend.delivery.api;

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
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Contract tests for /api/deliveries endpoints.
 * Tests validate the delivery management API contract per US5 - Delivery Tracking.
 * <p>
 * Test-First Development: These tests MUST be written FIRST and MUST FAIL initially.
 * Per Constitution Principle I (Test-First Development).
 * <p>
 * T130: POST /api/deliveries?projectId={projectId} - validates quantity_delivered <= quotation quantity
 * T131: GET /api/deliveries?projectId={projectId} - list deliveries for project
 * T131: GET /api/deliveries/{id}/statement - PDF generation
 */
@Tag("integration")
@AutoConfigureMockMvc
@Transactional
@DisplayName("Delivery Controller Contract Tests")
class DeliveryControllerTest extends BaseIntegrationTest implements TestFixtures {

    private static final String DELIVERIES_BASE_URL = "/api/deliveries";

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

    private Long testProjectId;
    private Long testQuotationId;

    @BeforeEach
    void setUp() {
        DatabaseTestHelper.insertTestUsersWithRoles(jdbcTemplate);
        DatabaseTestHelper.insertTestProducts(jdbcTemplate);

        // Generate tokens for different roles
        adminToken = jwtTokenProvider.generateToken(ADMIN_USERNAME, Role.ADMIN.getAuthority(), TEST_USER_ID);
        financeToken = jwtTokenProvider.generateToken(FINANCE_USERNAME, Role.FINANCE.getAuthority(), 2L);
        productionToken = jwtTokenProvider.generateToken(PRODUCTION_USERNAME, Role.PRODUCTION.getAuthority(), 3L);
        salesToken = jwtTokenProvider.generateToken(SALES_USERNAME, Role.SALES.getAuthority(), 4L);

        // Create test project - use 3000L to avoid conflicts with QuotationControllerTest (1000L) and InvoiceControllerTest (2000L)
        String today = LocalDate.now().format(DateTimeFormatter.ofPattern("MMdd"));
        String year = LocalDate.now().format(DateTimeFormatter.ofPattern("yy"));
        jdbcTemplate.update(
                "INSERT INTO projects (id, job_code, customer_company_id, project_name, due_date, internal_owner_id, status, created_by_id) " +
                        "VALUES (?, ?, ?, ?, ?, ?, ?, ?) " +
                        "ON CONFLICT (id) DO NOTHING",
                3000L, "WK2K" + year + "-3000-" + today, 1L, "Delivery Test Project",
                LocalDate.now().plusDays(30), 1L, "ACTIVE", 1L
        );
        testProjectId = 3000L;

        // Create test quotation with APPROVED status
        jdbcTemplate.update(
                "INSERT INTO quotations (id, project_id, version, status, total_amount, quotation_date, validity_days, created_by_id) " +
                        "VALUES (?, ?, ?, ?, ?, ?, ?, ?) " +
                        "ON CONFLICT (id) DO NOTHING",
                3000L, testProjectId, 1, "ACCEPTED", 500000.00, LocalDate.now(), 30, 1L
        );
        testQuotationId = 3000L;

        // Create quotation line items (products and quantities to deliver)
        // Product 1: 10 units, Product 2: 20 units
        jdbcTemplate.update(
                "INSERT INTO quotation_line_items (id, quotation_id, product_id, sequence, quantity, unit_price, line_total) " +
                        "VALUES (?, ?, ?, ?, ?, ?, ?) " +
                        "ON CONFLICT (id) DO NOTHING",
                3001L, testQuotationId, 1L, 1, 10.0, 50000.00, 500000.00
        );
        jdbcTemplate.update(
                "INSERT INTO quotation_line_items (id, quotation_id, product_id, sequence, quantity, unit_price, line_total) " +
                        "VALUES (?, ?, ?, ?, ?, ?, ?) " +
                        "ON CONFLICT (id) DO NOTHING",
                3002L, testQuotationId, 2L, 2, 20.0, 3500.00, 70000.00
        );
    }

    @Nested
    @DisplayName("POST /api/deliveries?projectId={projectId} - T130: Create Delivery")
    class CreateDeliveryTests {

        @Test
        @DisplayName("should return 201 when creating valid delivery for Admin")
        void createDelivery_AsAdmin_Returns201() throws Exception {
            String today = LocalDate.now().format(DateTimeFormatter.ISO_DATE);
            String createRequest = """
                    {
                        "quotationId": 3000,
                        "deliveryDate": "%s",
                        "lineItems": [
                            {"productId": 1, "quantityDelivered": 5.0},
                            {"productId": 2, "quantityDelivered": 10.0}
                        ]
                    }
                    """.formatted(today);

            mockMvc.perform(post(DELIVERIES_BASE_URL)
                            .param("projectId", testProjectId.toString())
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isCreated())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").isNumber())
                    .andExpect(jsonPath("$.data.message").value("Delivery created successfully"));
        }

        @Test
        @DisplayName("should return 201 when creating valid delivery for Finance")
        void createDelivery_AsFinance_Returns201() throws Exception {
            String today = LocalDate.now().format(DateTimeFormatter.ISO_DATE);
            String createRequest = """
                    {
                        "quotationId": 3000,
                        "deliveryDate": "%s",
                        "lineItems": [
                            {"productId": 1, "quantityDelivered": 3.0}
                        ]
                    }
                    """.formatted(today);

            mockMvc.perform(post(DELIVERIES_BASE_URL)
                            .param("projectId", testProjectId.toString())
                            .header("Authorization", "Bearer " + financeToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").isNumber());
        }

        @Test
        @DisplayName("should return 403 for Production role")
        void createDelivery_AsProduction_Returns403() throws Exception {
            String today = LocalDate.now().format(DateTimeFormatter.ISO_DATE);
            String createRequest = """
                    {
                        "quotationId": 3000,
                        "deliveryDate": "%s",
                        "lineItems": [
                            {"productId": 1, "quantityDelivered": 5.0}
                        ]
                    }
                    """.formatted(today);

            mockMvc.perform(post(DELIVERIES_BASE_URL)
                            .param("projectId", testProjectId.toString())
                            .header("Authorization", "Bearer " + productionToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 400 when quantity exceeds quotation quantity")
        void createDelivery_ExceedsQuotationQuantity_Returns400() throws Exception {
            String today = LocalDate.now().format(DateTimeFormatter.ISO_DATE);
            // Product 1 has quotation quantity of 10, trying to deliver 15
            String createRequest = """
                    {
                        "quotationId": 3000,
                        "deliveryDate": "%s",
                        "lineItems": [
                            {"productId": 1, "quantityDelivered": 15.0}
                        ]
                    }
                    """.formatted(today);

            mockMvc.perform(post(DELIVERIES_BASE_URL)
                            .param("projectId", testProjectId.toString())
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message", containsString("exceeds")));
        }

        @Test
        @DisplayName("should return 400 when cumulative delivery exceeds quotation quantity")
        void createDelivery_CumulativeExceedsQuotationQuantity_Returns400() throws Exception {
            // First, create a delivery with 8 units of Product 1 linked to the same quotation
            String today = LocalDate.now().format(DateTimeFormatter.ISO_DATE);
            jdbcTemplate.update(
                    "INSERT INTO deliveries (id, project_id, quotation_id, delivery_date, status, delivered_by_id) " +
                            "VALUES (?, ?, ?, ?, ?, ?)",
                    3100L, testProjectId, testQuotationId, LocalDate.now(), "DELIVERED", 1L
            );
            jdbcTemplate.update(
                    "INSERT INTO delivery_line_items (id, delivery_id, product_id, quantity_delivered) " +
                            "VALUES (?, ?, ?, ?)",
                    3101L, 3100L, 1L, 8.0
            );

            // Try to deliver 5 more units (total would be 13, exceeds quota of 10)
            String createRequest = """
                    {
                        "quotationId": 3000,
                        "deliveryDate": "%s",
                        "lineItems": [
                            {"productId": 1, "quantityDelivered": 5.0}
                        ]
                    }
                    """.formatted(today);

            mockMvc.perform(post(DELIVERIES_BASE_URL)
                            .param("projectId", testProjectId.toString())
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 400 when delivery date is in the future")
        void createDelivery_FutureDate_Returns400() throws Exception {
            String futureDate = LocalDate.now().plusDays(7).format(DateTimeFormatter.ISO_DATE);
            String createRequest = """
                    {
                        "quotationId": 3000,
                        "deliveryDate": "%s",
                        "lineItems": [
                            {"productId": 1, "quantityDelivered": 5.0}
                        ]
                    }
                    """.formatted(futureDate);

            mockMvc.perform(post(DELIVERIES_BASE_URL)
                            .param("projectId", testProjectId.toString())
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 400 when line items are empty")
        void createDelivery_EmptyLineItems_Returns400() throws Exception {
            String today = LocalDate.now().format(DateTimeFormatter.ISO_DATE);
            String createRequest = """
                    {
                        "quotationId": 3000,
                        "deliveryDate": "%s",
                        "lineItems": []
                    }
                    """.formatted(today);

            mockMvc.perform(post(DELIVERIES_BASE_URL)
                            .param("projectId", testProjectId.toString())
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 400 when quantity is zero or negative")
        void createDelivery_ZeroQuantity_Returns400() throws Exception {
            String today = LocalDate.now().format(DateTimeFormatter.ISO_DATE);
            String createRequest = """
                    {
                        "quotationId": 3000,
                        "deliveryDate": "%s",
                        "lineItems": [
                            {"productId": 1, "quantityDelivered": 0}
                        ]
                    }
                    """.formatted(today);

            mockMvc.perform(post(DELIVERIES_BASE_URL)
                            .param("projectId", testProjectId.toString())
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 400 when product is not in quotation")
        void createDelivery_ProductNotInQuotation_Returns400() throws Exception {
            String today = LocalDate.now().format(DateTimeFormatter.ISO_DATE);
            // Product 3 is not in the quotation
            String createRequest = """
                    {
                        "quotationId": 3000,
                        "deliveryDate": "%s",
                        "lineItems": [
                            {"productId": 3, "quantityDelivered": 5.0}
                        ]
                    }
                    """.formatted(today);

            mockMvc.perform(post(DELIVERIES_BASE_URL)
                            .param("projectId", testProjectId.toString())
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 404 for non-existent quotation")
        void createDelivery_NonExistentQuotation_Returns404() throws Exception {
            String today = LocalDate.now().format(DateTimeFormatter.ISO_DATE);
            String createRequest = """
                    {
                        "quotationId": 99999,
                        "deliveryDate": "%s",
                        "lineItems": [
                            {"productId": 1, "quantityDelivered": 5.0}
                        ]
                    }
                    """.formatted(today);

            mockMvc.perform(post(DELIVERIES_BASE_URL)
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("should return 401 without authentication")
        void createDelivery_WithoutAuth_Returns401() throws Exception {
            String today = LocalDate.now().format(DateTimeFormatter.ISO_DATE);
            String createRequest = """
                    {
                        "quotationId": %d,
                        "deliveryDate": "%s",
                        "lineItems": [
                            {"productId": 1, "quantityDelivered": 5.0}
                        ]
                    }
                    """.formatted(testQuotationId, today);

            mockMvc.perform(post(DELIVERIES_BASE_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("GET /api/deliveries?projectId={projectId} - T131: List Deliveries")
    class ListDeliveriesTests {

        @BeforeEach
        void setUpDeliveries() {
            // Create test deliveries
            jdbcTemplate.update(
                    "INSERT INTO deliveries (id, project_id, delivery_date, status, delivered_by_id) " +
                            "VALUES (?, ?, ?, ?, ?) " +
                            "ON CONFLICT (id) DO NOTHING",
                    3001L, testProjectId, LocalDate.now().minusDays(2), "DELIVERED", 1L
            );
            jdbcTemplate.update(
                    "INSERT INTO delivery_line_items (id, delivery_id, product_id, quantity_delivered) " +
                            "VALUES (?, ?, ?, ?) " +
                            "ON CONFLICT (id) DO NOTHING",
                    3001L, 3001L, 1L, 3.0
            );
            jdbcTemplate.update(
                    "INSERT INTO deliveries (id, project_id, delivery_date, status, delivered_by_id) " +
                            "VALUES (?, ?, ?, ?, ?) " +
                            "ON CONFLICT (id) DO NOTHING",
                    3002L, testProjectId, LocalDate.now().minusDays(1), "DELIVERED", 2L
            );
            jdbcTemplate.update(
                    "INSERT INTO delivery_line_items (id, delivery_id, product_id, quantity_delivered) " +
                            "VALUES (?, ?, ?, ?) " +
                            "ON CONFLICT (id) DO NOTHING",
                    3002L, 3002L, 2L, 5.0
            );
        }

        @Test
        @DisplayName("should return 200 with delivery list for Admin")
        void listDeliveries_AsAdmin_Returns200() throws Exception {
            mockMvc.perform(get(DELIVERIES_BASE_URL)
                            .param("projectId", testProjectId.toString())
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(2))))
                    .andExpect(jsonPath("$.data[0].id").isNumber())
                    .andExpect(jsonPath("$.data[0].deliveryDate").isString())
                    .andExpect(jsonPath("$.data[0].status").isString())
                    .andExpect(jsonPath("$.data[0].lineItems").isArray());
        }

        @Test
        @DisplayName("should return 200 with delivery list for Finance")
        void listDeliveries_AsFinance_Returns200() throws Exception {
            mockMvc.perform(get(DELIVERIES_BASE_URL)
                            .param("projectId", testProjectId.toString())
                            .header("Authorization", "Bearer " + financeToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }

        @Test
        @DisplayName("should return 200 with read-only delivery list for Sales")
        void listDeliveries_AsSales_Returns200() throws Exception {
            mockMvc.perform(get(DELIVERIES_BASE_URL)
                            .param("projectId", testProjectId.toString())
                            .header("Authorization", "Bearer " + salesToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }

        @Test
        @DisplayName("should return 200 with read-only delivery list for Production")
        void listDeliveries_AsProduction_Returns200() throws Exception {
            mockMvc.perform(get(DELIVERIES_BASE_URL)
                            .param("projectId", testProjectId.toString())
                            .header("Authorization", "Bearer " + productionToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }

        @Test
        @DisplayName("should return empty list for project with no deliveries")
        void listDeliveries_NoDeliveries_ReturnsEmptyList() throws Exception {
            // Create a project with no deliveries
            String today = LocalDate.now().format(DateTimeFormatter.ofPattern("MMdd"));
            String year = LocalDate.now().format(DateTimeFormatter.ofPattern("yy"));
            jdbcTemplate.update(
                    "INSERT INTO projects (id, job_code, customer_company_id, project_name, due_date, internal_owner_id, status, created_by_id) " +
                            "VALUES (?, ?, ?, ?, ?, ?, ?, ?) " +
                            "ON CONFLICT (id) DO NOTHING",
                    1001L, "WK2K" + year + "-1001-" + today, 1L, "Empty Delivery Project",
                    LocalDate.now().plusDays(30), 1L, "ACTIVE", 1L
            );

            mockMvc.perform(get(DELIVERIES_BASE_URL)
                            .param("projectId", "1001")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data", hasSize(0)));
        }

        @Test
        @DisplayName("should return 200 with empty list for non-existent project")
        void listDeliveries_NonExistentProject_ReturnsEmptyList() throws Exception {
            mockMvc.perform(get(DELIVERIES_BASE_URL)
                            .param("projectId", "99999")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data", hasSize(0)));
        }

        @Test
        @DisplayName("should return 401 without authentication")
        void listDeliveries_WithoutAuth_Returns401() throws Exception {
            mockMvc.perform(get(DELIVERIES_BASE_URL)
                            .param("projectId", testProjectId.toString()))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("GET /api/deliveries/{id} - Get Delivery Detail")
    class GetDeliveryDetailTests {

        @BeforeEach
        void setUpDelivery() {
            jdbcTemplate.update(
                    "INSERT INTO deliveries (id, project_id, delivery_date, status, delivered_by_id) " +
                            "VALUES (?, ?, ?, ?, ?) " +
                            "ON CONFLICT (id) DO NOTHING",
                    4001L, testProjectId, LocalDate.now(), "DELIVERED", 1L
            );
            jdbcTemplate.update(
                    "INSERT INTO delivery_line_items (id, delivery_id, product_id, quantity_delivered) " +
                            "VALUES (?, ?, ?, ?) " +
                            "ON CONFLICT (id) DO NOTHING",
                    4001L, 4001L, 1L, 5.0
            );
            jdbcTemplate.update(
                    "INSERT INTO delivery_line_items (id, delivery_id, product_id, quantity_delivered) " +
                            "VALUES (?, ?, ?, ?) " +
                            "ON CONFLICT (id) DO NOTHING",
                    4002L, 4001L, 2L, 10.0
            );
        }

        @Test
        @DisplayName("should return 200 with delivery details")
        void getDelivery_AsAdmin_Returns200() throws Exception {
            mockMvc.perform(get("/api/deliveries/4001")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").value(4001))
                    .andExpect(jsonPath("$.data.projectId").value(testProjectId))
                    .andExpect(jsonPath("$.data.status").value("DELIVERED"))
                    .andExpect(jsonPath("$.data.lineItems", hasSize(2)))
                    .andExpect(jsonPath("$.data.lineItems[0].productId").isNumber())
                    .andExpect(jsonPath("$.data.lineItems[0].quantityDelivered").isNumber());
        }

        @Test
        @DisplayName("should return 404 for non-existent delivery")
        void getDelivery_NonExistent_Returns404() throws Exception {
            mockMvc.perform(get("/api/deliveries/99999")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("should return 401 without authentication")
        void getDelivery_WithoutAuth_Returns401() throws Exception {
            mockMvc.perform(get("/api/deliveries/4001"))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("GET /api/deliveries/{id}/statement - T131: Generate Transaction Statement PDF")
    class GenerateStatementTests {

        @BeforeEach
        void setUpDelivery() {
            jdbcTemplate.update(
                    "INSERT INTO deliveries (id, project_id, delivery_date, status, delivered_by_id) " +
                            "VALUES (?, ?, ?, ?, ?) " +
                            "ON CONFLICT (id) DO NOTHING",
                    5001L, testProjectId, LocalDate.now(), "DELIVERED", 1L
            );
            jdbcTemplate.update(
                    "INSERT INTO delivery_line_items (id, delivery_id, product_id, quantity_delivered) " +
                            "VALUES (?, ?, ?, ?) " +
                            "ON CONFLICT (id) DO NOTHING",
                    5001L, 5001L, 1L, 5.0
            );
        }

        @Test
        @DisplayName("should return 200 with PDF for Admin")
        void generateStatement_AsAdmin_Returns200WithPdf() throws Exception {
            mockMvc.perform(get("/api/deliveries/5001/statement")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_PDF));
        }

        @Test
        @DisplayName("should return 200 with PDF for Finance")
        void generateStatement_AsFinance_Returns200WithPdf() throws Exception {
            mockMvc.perform(get("/api/deliveries/5001/statement")
                            .header("Authorization", "Bearer " + financeToken))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_PDF));
        }

        @Test
        @DisplayName("should return 403 for Production role")
        void generateStatement_AsProduction_Returns403() throws Exception {
            mockMvc.perform(get("/api/deliveries/5001/statement")
                            .header("Authorization", "Bearer " + productionToken))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 404 for non-existent delivery")
        void generateStatement_NonExistentDelivery_Returns404() throws Exception {
            mockMvc.perform(get("/api/deliveries/99999/statement")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("should return 401 without authentication")
        void generateStatement_WithoutAuth_Returns401() throws Exception {
            mockMvc.perform(get("/api/deliveries/5001/statement"))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("Delivery Quantity Tracking - T132/T133: Double-Invoicing Prevention")
    class DeliveryQuantityTrackingTests {

        @Test
        @Transactional(propagation = Propagation.NOT_SUPPORTED)
        @DisplayName("should track remaining deliverable quantity correctly")
        void createDelivery_TracksRemainingQuantity() throws Exception {
            // Use isolated test data to avoid affecting other tests
            // Use 4000L range to avoid conflicts with InvoiceControllerTest (2000L)
            // Product ID 1 already exists from test fixtures
            Long trackingProjectId = 4000L;
            Long trackingQuotationId = 4000L;
            Long trackingProductId = 1L;  // Uses existing product from test fixtures

            // Setup isolated test data
            String today = LocalDate.now().format(DateTimeFormatter.ISO_DATE);
            String year = LocalDate.now().format(DateTimeFormatter.ofPattern("yy"));
            String dayMonth = LocalDate.now().format(DateTimeFormatter.ofPattern("MMdd"));

            jdbcTemplate.update(
                    "INSERT INTO projects (id, job_code, customer_company_id, project_name, due_date, internal_owner_id, status, created_by_id) " +
                            "VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING",
                    trackingProjectId, "WK2K" + year + "-4000-" + dayMonth, 1L, "Tracking Test Project",
                    LocalDate.now().plusDays(30), 1L, "ACTIVE", 1L
            );
            jdbcTemplate.update(
                    "INSERT INTO quotations (id, project_id, version, status, total_amount, quotation_date, validity_days, created_by_id) " +
                            "VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING",
                    trackingQuotationId, trackingProjectId, 1, "ACCEPTED", 100000.00, LocalDate.now(), 30, 1L
            );
            jdbcTemplate.update(
                    "INSERT INTO quotation_line_items (id, quotation_id, product_id, sequence, quantity, unit_price, line_total) " +
                            "VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING",
                    4001L, trackingQuotationId, trackingProductId, 1, 10.0, 10000.00, 100000.00
            );

            // First delivery: 3 units (quota: 10)
            String firstDelivery = """
                    {
                        "quotationId": %d,
                        "deliveryDate": "%s",
                        "lineItems": [
                            {"productId": %d, "quantityDelivered": 3.0}
                        ]
                    }
                    """.formatted(trackingQuotationId, today, trackingProductId);

            mockMvc.perform(post(DELIVERIES_BASE_URL)
                            .param("projectId", trackingProjectId.toString())
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(firstDelivery))
                    .andExpect(status().isCreated());

            // Second delivery: 5 more units (total: 8, remaining: 2)
            String secondDelivery = """
                    {
                        "quotationId": %d,
                        "deliveryDate": "%s",
                        "lineItems": [
                            {"productId": %d, "quantityDelivered": 5.0}
                        ]
                    }
                    """.formatted(trackingQuotationId, today, trackingProductId);

            mockMvc.perform(post(DELIVERIES_BASE_URL)
                            .param("projectId", trackingProjectId.toString())
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(secondDelivery))
                    .andExpect(status().isCreated());

            // Third delivery: try to deliver 3 more units (would exceed quota of 10)
            String thirdDelivery = """
                    {
                        "quotationId": %d,
                        "deliveryDate": "%s",
                        "lineItems": [
                            {"productId": %d, "quantityDelivered": 3.0}
                        ]
                    }
                    """.formatted(trackingQuotationId, today, trackingProductId);

            mockMvc.perform(post(DELIVERIES_BASE_URL)
                            .param("projectId", trackingProjectId.toString())
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(thirdDelivery))
                    .andExpect(status().isBadRequest());

            // Fourth delivery: deliver exactly remaining 2 units (should succeed)
            String fourthDelivery = """
                    {
                        "quotationId": %d,
                        "deliveryDate": "%s",
                        "lineItems": [
                            {"productId": %d, "quantityDelivered": 2.0}
                        ]
                    }
                    """.formatted(trackingQuotationId, today, trackingProductId);

            mockMvc.perform(post(DELIVERIES_BASE_URL)
                            .param("projectId", trackingProjectId.toString())
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(fourthDelivery))
                    .andExpect(status().isCreated());
        }

        @Test
        @DisplayName("should allow partial deliveries across multiple products")
        void createDelivery_PartialDeliveryMultipleProducts() throws Exception {
            String today = LocalDate.now().format(DateTimeFormatter.ISO_DATE);

            // Deliver 5 units of Product 1 and 10 units of Product 2
            String createRequest = """
                    {
                        "quotationId": 3000,
                        "deliveryDate": "%s",
                        "lineItems": [
                            {"productId": 1, "quantityDelivered": 5.0},
                            {"productId": 2, "quantityDelivered": 10.0}
                        ]
                    }
                    """.formatted(today);

            String response = mockMvc.perform(post(DELIVERIES_BASE_URL)
                            .param("projectId", testProjectId.toString())
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isCreated())
                    .andReturn().getResponse().getContentAsString();

            // Verify the delivery was created
            Long deliveryId = objectMapper.readTree(response).at("/data/id").asLong();

            mockMvc.perform(get("/api/deliveries/" + deliveryId)
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.lineItems", hasSize(2)));
        }
    }
}
