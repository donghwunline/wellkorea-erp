package com.wellkorea.backend.invoice.api;

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
 * Contract tests for /api/invoices endpoints.
 * Tests validate the invoice management API contract per US6 - Tax Invoices & Payments.
 * <p>
 * Test-First Development: These tests MUST be written FIRST and MUST FAIL initially.
 * Per Constitution Principle I (Test-First Development).
 * <p>
 * T146: POST /api/invoices - creates invoice, auto-populates from delivery
 * T147: POST /api/invoices/{id}/payments - validates payment <= invoice total
 * T148: GET /api/reports/ar - AR aging analysis
 */
@Tag("integration")
@AutoConfigureMockMvc
@Transactional
@DisplayName("Invoice Controller Contract Tests")
class InvoiceControllerTest extends BaseIntegrationTest implements TestFixtures {

    private static final String INVOICES_BASE_URL = "/api/invoices";

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

    private Long testProjectId;
    private Long testDeliveryId;

    @BeforeEach
    void setUp() {
        DatabaseTestHelper.insertTestUsersWithRoles(jdbcTemplate);
        DatabaseTestHelper.insertTestProducts(jdbcTemplate);

        // Generate tokens for different roles
        adminToken = jwtTokenProvider.generateToken(ADMIN_USERNAME, Role.ADMIN.getAuthority(), TEST_USER_ID);
        financeToken = jwtTokenProvider.generateToken(FINANCE_USERNAME, Role.FINANCE.getAuthority(), 2L);
        salesToken = jwtTokenProvider.generateToken(SALES_USERNAME, Role.SALES.getAuthority(), 4L);

        // Create test project
        String today = LocalDate.now().format(DateTimeFormatter.ofPattern("MMdd"));
        String year = LocalDate.now().format(DateTimeFormatter.ofPattern("yy"));
        jdbcTemplate.update(
                "INSERT INTO projects (id, job_code, customer_company_id, project_name, due_date, internal_owner_id, status, created_by_id) " +
                        "VALUES (?, ?, ?, ?, ?, ?, ?, ?) " +
                        "ON CONFLICT (id) DO NOTHING",
                2000L, "WK2K" + year + "-2000-" + today, 1L, "Invoice Test Project",
                LocalDate.now().plusDays(30), 1L, "ACTIVE", 1L
        );
        testProjectId = 2000L;

        // Create test quotation with APPROVED status (required for invoice creation validation)
        jdbcTemplate.update(
                "INSERT INTO quotations (id, project_id, version, status, total_amount, quotation_date, validity_days, created_by_id) " +
                        "VALUES (?, ?, ?, ?, ?, ?, ?, ?) " +
                        "ON CONFLICT (id) DO NOTHING",
                2000L, testProjectId, 1, "APPROVED", 100000.00, LocalDate.now(), 30, 1L
        );

        // Create quotation line items (products and quantities that can be delivered/invoiced)
        // Product 1: 10 units, Product 2: 20 units
        jdbcTemplate.update(
                "INSERT INTO quotation_line_items (id, quotation_id, product_id, sequence, quantity, unit_price, line_total) " +
                        "VALUES (?, ?, ?, ?, ?, ?, ?) " +
                        "ON CONFLICT (id) DO NOTHING",
                2001L, 2000L, 1L, 1, 10.0, 10000.00, 100000.00
        );
        jdbcTemplate.update(
                "INSERT INTO quotation_line_items (id, quotation_id, product_id, sequence, quantity, unit_price, line_total) " +
                        "VALUES (?, ?, ?, ?, ?, ?, ?) " +
                        "ON CONFLICT (id) DO NOTHING",
                2002L, 2000L, 2L, 2, 20.0, 5000.00, 100000.00
        );

        // Create test delivery (with DELIVERED status so quantities can be invoiced)
        jdbcTemplate.update(
                "INSERT INTO deliveries (id, project_id, quotation_id, delivery_date, status, delivered_by_id, created_at, updated_at) " +
                        "VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) " +
                        "ON CONFLICT (id) DO NOTHING",
                2000L, testProjectId, 2000L, LocalDate.now(), "DELIVERED", 1L
        );
        testDeliveryId = 2000L;

        // Create delivery line items (columns: id, delivery_id, product_id, quantity_delivered)
        // These delivered quantities can be invoiced
        jdbcTemplate.update(
                "INSERT INTO delivery_line_items (id, delivery_id, product_id, quantity_delivered) " +
                        "VALUES (?, ?, ?, ?) " +
                        "ON CONFLICT (id) DO NOTHING",
                2003L, testDeliveryId, 1L, 5.0
        );
        jdbcTemplate.update(
                "INSERT INTO delivery_line_items (id, delivery_id, product_id, quantity_delivered) " +
                        "VALUES (?, ?, ?, ?) " +
                        "ON CONFLICT (id) DO NOTHING",
                2004L, testDeliveryId, 2L, 10.0
        );
    }

    @Nested
    @DisplayName("POST /api/invoices - T146: Create Invoice")
    class CreateInvoiceTests {

        @Test
        @DisplayName("should return 201 when creating valid invoice for Admin")
        void createInvoice_AsAdmin_Returns201() throws Exception {
            String today = LocalDate.now().format(DateTimeFormatter.ISO_DATE);
            String dueDate = LocalDate.now().plusDays(30).format(DateTimeFormatter.ISO_DATE);
            String createRequest = """
                    {
                        "projectId": %d,
                        "quotationId": 2000,
                        "deliveryId": %d,
                        "issueDate": "%s",
                        "dueDate": "%s",
                        "taxRate": 10.0,
                        "notes": "Test invoice",
                        "lineItems": [
                            {"productId": 1, "productName": "Test Product 1", "productSku": "SKU-001", "quantityInvoiced": 5.0, "unitPrice": 10000.00},
                            {"productId": 2, "productName": "Test Product 2", "productSku": "SKU-002", "quantityInvoiced": 10.0, "unitPrice": 5000.00}
                        ]
                    }
                    """.formatted(testProjectId, testDeliveryId, today, dueDate);

            mockMvc.perform(post(INVOICES_BASE_URL)
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isCreated())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").isNumber())
                    .andExpect(jsonPath("$.data.message").value("Invoice created successfully"));
        }

        @Test
        @DisplayName("should return 201 when creating valid invoice for Finance")
        void createInvoice_AsFinance_Returns201() throws Exception {
            String today = LocalDate.now().format(DateTimeFormatter.ISO_DATE);
            String dueDate = LocalDate.now().plusDays(30).format(DateTimeFormatter.ISO_DATE);
            String createRequest = """
                    {
                        "projectId": %d,
                        "quotationId": 2000,
                        "issueDate": "%s",
                        "dueDate": "%s",
                        "lineItems": [
                            {"productId": 1, "productName": "Test Product 1", "quantityInvoiced": 3.0, "unitPrice": 10000.00}
                        ]
                    }
                    """.formatted(testProjectId, today, dueDate);

            mockMvc.perform(post(INVOICES_BASE_URL)
                            .header("Authorization", "Bearer " + financeToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").isNumber());
        }

        @Test
        @DisplayName("should return 403 when Sales tries to create invoice")
        void createInvoice_AsSales_Returns403() throws Exception {
            String today = LocalDate.now().format(DateTimeFormatter.ISO_DATE);
            String dueDate = LocalDate.now().plusDays(30).format(DateTimeFormatter.ISO_DATE);
            String createRequest = """
                    {
                        "projectId": %d,
                        "quotationId": 2000,
                        "issueDate": "%s",
                        "dueDate": "%s",
                        "lineItems": [
                            {"productId": 1, "productName": "Test Product 1", "quantityInvoiced": 1.0, "unitPrice": 10000.00}
                        ]
                    }
                    """.formatted(testProjectId, today, dueDate);

            mockMvc.perform(post(INVOICES_BASE_URL)
                            .header("Authorization", "Bearer " + salesToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 400 when due date is before issue date")
        void createInvoice_DueDateBeforeIssueDate_Returns400() throws Exception {
            String today = LocalDate.now().format(DateTimeFormatter.ISO_DATE);
            String yesterday = LocalDate.now().minusDays(1).format(DateTimeFormatter.ISO_DATE);
            String createRequest = """
                    {
                        "projectId": %d,
                        "quotationId": 2000,
                        "issueDate": "%s",
                        "dueDate": "%s",
                        "lineItems": [
                            {"productId": 1, "productName": "Test Product 1", "quantityInvoiced": 1.0, "unitPrice": 10000.00}
                        ]
                    }
                    """.formatted(testProjectId, today, yesterday);

            mockMvc.perform(post(INVOICES_BASE_URL)
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 400 when no line items provided")
        void createInvoice_NoLineItems_Returns400() throws Exception {
            String today = LocalDate.now().format(DateTimeFormatter.ISO_DATE);
            String dueDate = LocalDate.now().plusDays(30).format(DateTimeFormatter.ISO_DATE);
            String createRequest = """
                    {
                        "projectId": %d,
                        "quotationId": 2000,
                        "issueDate": "%s",
                        "dueDate": "%s",
                        "lineItems": []
                    }
                    """.formatted(testProjectId, today, dueDate);

            mockMvc.perform(post(INVOICES_BASE_URL)
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createRequest))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("GET /api/invoices - List Invoices")
    class ListInvoicesTests {

        @Test
        @DisplayName("should return 200 with paginated list for Admin")
        void listInvoices_AsAdmin_Returns200() throws Exception {
            // Create an invoice first
            createTestInvoice();

            mockMvc.perform(get(INVOICES_BASE_URL)
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content").isArray());
        }

        @Test
        @DisplayName("should return 200 for Sales (can view)")
        void listInvoices_AsSales_Returns200() throws Exception {
            mockMvc.perform(get(INVOICES_BASE_URL)
                            .header("Authorization", "Bearer " + salesToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }
    }

    @Nested
    @DisplayName("GET /api/invoices/{id} - Get Invoice Detail")
    class GetInvoiceDetailTests {

        @Test
        @DisplayName("should return 200 with invoice details for Admin")
        void getInvoiceDetail_AsAdmin_Returns200() throws Exception {
            Long invoiceId = createTestInvoice();

            mockMvc.perform(get(INVOICES_BASE_URL + "/" + invoiceId)
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").value(invoiceId))
                    .andExpect(jsonPath("$.data.invoiceNumber").isNotEmpty())
                    .andExpect(jsonPath("$.data.status").value("DRAFT"))
                    .andExpect(jsonPath("$.data.lineItems").isArray())
                    .andExpect(jsonPath("$.data.payments").isArray());
        }

        @Test
        @DisplayName("should return 404 when invoice not found")
        void getInvoiceDetail_NotFound_Returns404() throws Exception {
            mockMvc.perform(get(INVOICES_BASE_URL + "/99999")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isBadRequest()); // IllegalArgumentException
        }
    }

    @Nested
    @DisplayName("POST /api/invoices/{id}/issue - Issue Invoice")
    class IssueInvoiceTests {

        @Test
        @DisplayName("should return 200 when issuing draft invoice")
        void issueInvoice_FromDraft_Returns200() throws Exception {
            Long invoiceId = createTestInvoice();

            mockMvc.perform(post(INVOICES_BASE_URL + "/" + invoiceId + "/issue")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").value(invoiceId))
                    .andExpect(jsonPath("$.data.message").value("Invoice issued successfully"));
        }
    }

    @Nested
    @DisplayName("POST /api/invoices/{id}/payments - T147: Record Payment")
    class RecordPaymentTests {

        @Test
        @DisplayName("should return 201 when recording valid payment")
        void recordPayment_Valid_Returns201() throws Exception {
            Long invoiceId = createTestInvoice();
            // Issue the invoice first (required before payments)
            issueInvoice(invoiceId);

            String today = LocalDate.now().format(DateTimeFormatter.ISO_DATE);
            String paymentRequest = """
                    {
                        "paymentDate": "%s",
                        "amount": 10000.00,
                        "paymentMethod": "BANK_TRANSFER",
                        "referenceNumber": "REF-001",
                        "notes": "First payment"
                    }
                    """.formatted(today);

            mockMvc.perform(post(INVOICES_BASE_URL + "/" + invoiceId + "/payments")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(paymentRequest))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.invoiceId").value(invoiceId))
                    .andExpect(jsonPath("$.data.remainingBalance").isNumber())
                    .andExpect(jsonPath("$.data.message").exists());
        }

        @Test
        @DisplayName("should return 400 when payment exceeds remaining balance")
        void recordPayment_ExceedsBalance_Returns400() throws Exception {
            Long invoiceId = createTestInvoice();
            issueInvoice(invoiceId);

            String today = LocalDate.now().format(DateTimeFormatter.ISO_DATE);
            // Invoice total is 55,000 + 10% tax = 60,500
            String paymentRequest = """
                    {
                        "paymentDate": "%s",
                        "amount": 999999999.00,
                        "paymentMethod": "BANK_TRANSFER"
                    }
                    """.formatted(today);

            mockMvc.perform(post(INVOICES_BASE_URL + "/" + invoiceId + "/payments")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(paymentRequest))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 409 when trying to record payment on draft invoice")
        void recordPayment_OnDraft_Returns409Conflict() throws Exception {
            Long invoiceId = createTestInvoice(); // Still in DRAFT status

            String today = LocalDate.now().format(DateTimeFormatter.ISO_DATE);
            String paymentRequest = """
                    {
                        "paymentDate": "%s",
                        "amount": 1000.00,
                        "paymentMethod": "CASH"
                    }
                    """.formatted(today);

            // 409 Conflict - invoice is in wrong state (DRAFT) to receive payments
            mockMvc.perform(post(INVOICES_BASE_URL + "/" + invoiceId + "/payments")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(paymentRequest))
                    .andExpect(status().isConflict());
        }
    }

    @Nested
    @DisplayName("GET /api/reports/ar - T148: AR Aging Report")
    class ARReportTests {

        @Test
        @DisplayName("should return 200 with AR aging report for Finance")
        void getARReport_AsFinance_Returns200() throws Exception {
            mockMvc.perform(get("/api/reports/ar")
                            .header("Authorization", "Bearer " + financeToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.totalOutstanding").isNumber())
                    .andExpect(jsonPath("$.data.currentAmount").isNumber())
                    .andExpect(jsonPath("$.data.days30Amount").isNumber())
                    .andExpect(jsonPath("$.data.days60Amount").isNumber())
                    .andExpect(jsonPath("$.data.days90PlusAmount").isNumber())
                    .andExpect(jsonPath("$.data.invoices").isArray());
        }

        @Test
        @DisplayName("should return 403 for Sales (cannot access AR report)")
        void getARReport_AsSales_Returns403() throws Exception {
            mockMvc.perform(get("/api/reports/ar")
                            .header("Authorization", "Bearer " + salesToken))
                    .andExpect(status().isForbidden());
        }
    }

    // Helper methods
    private Long createTestInvoice() throws Exception {
        String today = LocalDate.now().format(DateTimeFormatter.ISO_DATE);
        String dueDate = LocalDate.now().plusDays(30).format(DateTimeFormatter.ISO_DATE);
        String createRequest = """
                {
                    "projectId": %d,
                    "quotationId": 2000,
                    "deliveryId": %d,
                    "issueDate": "%s",
                    "dueDate": "%s",
                    "taxRate": 10.0,
                    "lineItems": [
                        {"productId": 1, "productName": "Test Product 1", "productSku": "SKU-001", "quantityInvoiced": 5.0, "unitPrice": 10000.00},
                        {"productId": 2, "productName": "Test Product 2", "productSku": "SKU-002", "quantityInvoiced": 1.0, "unitPrice": 5000.00}
                    ]
                }
                """.formatted(testProjectId, testDeliveryId, today, dueDate);

        String response = mockMvc.perform(post(INVOICES_BASE_URL)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createRequest))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        // Extract ID from response
        return objectMapper.readTree(response).path("data").path("id").asLong();
    }

    private void issueInvoice(Long invoiceId) throws Exception {
        mockMvc.perform(post(INVOICES_BASE_URL + "/" + invoiceId + "/issue")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
    }
}
