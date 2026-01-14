package com.wellkorea.backend.report.api;

import com.wellkorea.backend.BaseIntegrationTest;
import com.wellkorea.backend.auth.domain.Role;
import com.wellkorea.backend.auth.infrastructure.config.JwtTokenProvider;
import com.wellkorea.backend.shared.test.DatabaseTestHelper;
import com.wellkorea.backend.shared.test.TestFixtures;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Contract tests for /api/reports endpoints.
 * Tests validate the reporting API contract.
 * <p>
 * T148: GET /api/reports/ar - AR aging analysis
 */
@Tag("integration")
@AutoConfigureMockMvc
@Transactional
@DisplayName("Report Controller Contract Tests")
class ReportControllerTest extends BaseIntegrationTest implements TestFixtures {

    private static final String REPORTS_BASE_URL = "/api/reports";

    @Autowired
    private MockMvc mockMvc;

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
        DatabaseTestHelper.insertTestProducts(jdbcTemplate);
        DatabaseTestHelper.insertTestCustomer(jdbcTemplate);

        // Generate tokens for different roles
        adminToken = jwtTokenProvider.generateToken(ADMIN_USERNAME, Role.ADMIN.getAuthority(), TEST_USER_ID);
        financeToken = jwtTokenProvider.generateToken(FINANCE_USERNAME, Role.FINANCE.getAuthority(), 2L);
        salesToken = jwtTokenProvider.generateToken(SALES_USERNAME, Role.SALES.getAuthority(), 4L);
        productionToken = jwtTokenProvider.generateToken(PRODUCTION_USERNAME, Role.PRODUCTION.getAuthority(), 3L);
    }

    @Nested
    @DisplayName("GET /api/reports/ar - T148: AR Aging Report")
    class ARReportTests {

        @Test
        @DisplayName("should return 200 with AR aging report for Admin")
        void getARReport_AsAdmin_Returns200() throws Exception {
            mockMvc.perform(get(REPORTS_BASE_URL + "/ar")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.totalOutstanding").isNumber())
                    .andExpect(jsonPath("$.data.currentAmount").isNumber())
                    .andExpect(jsonPath("$.data.days30Amount").isNumber())
                    .andExpect(jsonPath("$.data.days60Amount").isNumber())
                    .andExpect(jsonPath("$.data.days90PlusAmount").isNumber())
                    .andExpect(jsonPath("$.data.totalInvoices").isNumber())
                    .andExpect(jsonPath("$.data.byCustomer").isArray())
                    .andExpect(jsonPath("$.data.invoices").isArray());
        }

        @Test
        @DisplayName("should return 200 with AR aging report for Finance")
        void getARReport_AsFinance_Returns200() throws Exception {
            mockMvc.perform(get(REPORTS_BASE_URL + "/ar")
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
            mockMvc.perform(get(REPORTS_BASE_URL + "/ar")
                            .header("Authorization", "Bearer " + salesToken))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 403 for Production (cannot access AR report)")
        void getARReport_AsProduction_Returns403() throws Exception {
            mockMvc.perform(get(REPORTS_BASE_URL + "/ar")
                            .header("Authorization", "Bearer " + productionToken))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 401 for unauthenticated request")
        void getARReport_Unauthenticated_Returns401() throws Exception {
            mockMvc.perform(get(REPORTS_BASE_URL + "/ar"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("should return report with unpaid invoices data")
        void getARReport_WithUnpaidInvoices_ReturnsCorrectData() throws Exception {
            // Setup test data: create project, quotation, delivery, and invoice
            setupTestInvoiceData();

            mockMvc.perform(get(REPORTS_BASE_URL + "/ar")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.totalInvoices").value(greaterThanOrEqualTo(1)))
                    .andExpect(jsonPath("$.data.invoices", hasSize(greaterThanOrEqualTo(1))))
                    .andExpect(jsonPath("$.data.invoices[0].invoiceNumber").isString())
                    .andExpect(jsonPath("$.data.invoices[0].agingBucket").isString());
        }

        @Test
        @DisplayName("should correctly categorize invoices by aging bucket")
        void getARReport_AgingBuckets_CorrectCategorization() throws Exception {
            // Setup test invoice with a past due date
            setupOverdueInvoice();

            mockMvc.perform(get(REPORTS_BASE_URL + "/ar")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    // Should have at least one invoice in an overdue bucket
                    .andExpect(jsonPath("$.data.invoices[?(@.agingBucket != 'Current')]", hasSize(greaterThanOrEqualTo(1))));
        }

        private void setupTestInvoiceData() {
            String today = LocalDate.now().format(DateTimeFormatter.ofPattern("MMdd"));
            String year = LocalDate.now().format(DateTimeFormatter.ofPattern("yy"));

            // Create test project
            jdbcTemplate.update(
                    "INSERT INTO projects (id, job_code, customer_company_id, project_name, due_date, internal_owner_id, status, created_by_id) " +
                            "VALUES (?, ?, ?, ?, ?, ?, ?, ?) " +
                            "ON CONFLICT (id) DO NOTHING",
                    9000L, "WK2K" + year + "-9000-" + today, 1L, "AR Report Test Project",
                    LocalDate.now().plusDays(30), 1L, "ACTIVE", 1L
            );

            // Create test quotation
            jdbcTemplate.update(
                    "INSERT INTO quotations (id, project_id, version, status, total_amount, quotation_date, validity_days, created_by_id) " +
                            "VALUES (?, ?, ?, ?, ?, ?, ?, ?) " +
                            "ON CONFLICT (id) DO NOTHING",
                    9000L, 9000L, 1, "APPROVED", 100000.00, LocalDate.now(), 30, 1L
            );

            // Create quotation line item
            jdbcTemplate.update(
                    "INSERT INTO quotation_line_items (id, quotation_id, product_id, sequence, quantity, unit_price, line_total) " +
                            "VALUES (?, ?, ?, ?, ?, ?, ?) " +
                            "ON CONFLICT (id) DO NOTHING",
                    9001L, 9000L, 1L, 1, 10.0, 10000.00, 100000.00
            );

            // Create test delivery
            jdbcTemplate.update(
                    "INSERT INTO deliveries (id, project_id, delivery_date, status, delivered_by_id) " +
                            "VALUES (?, ?, ?, ?, ?) " +
                            "ON CONFLICT (id) DO NOTHING",
                    9000L, 9000L, LocalDate.now(), "DELIVERED", 1L
            );

            // Create delivery line item
            jdbcTemplate.update(
                    "INSERT INTO delivery_line_items (id, delivery_id, product_id, quantity_delivered) " +
                            "VALUES (?, ?, ?, ?) " +
                            "ON CONFLICT (id) DO NOTHING",
                    9001L, 9000L, 1L, 10.0
            );

            // Create test invoice (ISSUED status, due in 30 days - Current bucket)
            jdbcTemplate.update(
                    "INSERT INTO tax_invoices (id, project_id, delivery_id, invoice_number, issue_date, due_date, status, " +
                            "total_before_tax, tax_rate, total_tax, total_amount, created_by_id) " +
                            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) " +
                            "ON CONFLICT (id) DO NOTHING",
                    9000L, 9000L, 9000L, "INV-2025-9000", LocalDate.now(), LocalDate.now().plusDays(30),
                    "ISSUED", 100000.00, 10.0, 10000.00, 110000.00, 1L
            );

            // Create invoice line item
            jdbcTemplate.update(
                    "INSERT INTO invoice_line_items (id, invoice_id, product_id, product_name, product_sku, quantity_invoiced, unit_price, line_total) " +
                            "VALUES (?, ?, ?, ?, ?, ?, ?, ?) " +
                            "ON CONFLICT (id) DO NOTHING",
                    9001L, 9000L, 1L, "Test Product", "SKU001", 10.0, 10000.00, 100000.00
            );
        }

        private void setupOverdueInvoice() {
            String today = LocalDate.now().format(DateTimeFormatter.ofPattern("MMdd"));
            String year = LocalDate.now().format(DateTimeFormatter.ofPattern("yy"));

            // Create test project for overdue invoice
            jdbcTemplate.update(
                    "INSERT INTO projects (id, job_code, customer_company_id, project_name, due_date, internal_owner_id, status, created_by_id) " +
                            "VALUES (?, ?, ?, ?, ?, ?, ?, ?) " +
                            "ON CONFLICT (id) DO NOTHING",
                    9100L, "WK2K" + year + "-9100-" + today, 1L, "AR Overdue Test Project",
                    LocalDate.now().plusDays(30), 1L, "ACTIVE", 1L
            );

            // Create test quotation
            jdbcTemplate.update(
                    "INSERT INTO quotations (id, project_id, version, status, total_amount, quotation_date, validity_days, created_by_id) " +
                            "VALUES (?, ?, ?, ?, ?, ?, ?, ?) " +
                            "ON CONFLICT (id) DO NOTHING",
                    9100L, 9100L, 1, "APPROVED", 50000.00, LocalDate.now(), 30, 1L
            );

            // Create quotation line item
            jdbcTemplate.update(
                    "INSERT INTO quotation_line_items (id, quotation_id, product_id, sequence, quantity, unit_price, line_total) " +
                            "VALUES (?, ?, ?, ?, ?, ?, ?) " +
                            "ON CONFLICT (id) DO NOTHING",
                    9101L, 9100L, 1L, 1, 5.0, 10000.00, 50000.00
            );

            // Create test delivery
            jdbcTemplate.update(
                    "INSERT INTO deliveries (id, project_id, delivery_date, status, delivered_by_id) " +
                            "VALUES (?, ?, ?, ?, ?) " +
                            "ON CONFLICT (id) DO NOTHING",
                    9100L, 9100L, LocalDate.now().minusDays(60), "DELIVERED", 1L
            );

            // Create delivery line item
            jdbcTemplate.update(
                    "INSERT INTO delivery_line_items (id, delivery_id, product_id, quantity_delivered) " +
                            "VALUES (?, ?, ?, ?) " +
                            "ON CONFLICT (id) DO NOTHING",
                    9101L, 9100L, 1L, 5.0
            );

            // Create OVERDUE invoice (due date was 45 days ago - should be in 60 Days bucket)
            jdbcTemplate.update(
                    "INSERT INTO tax_invoices (id, project_id, delivery_id, invoice_number, issue_date, due_date, status, " +
                            "total_before_tax, tax_rate, total_tax, total_amount, created_by_id) " +
                            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) " +
                            "ON CONFLICT (id) DO NOTHING",
                    9100L, 9100L, 9100L, "INV-2025-9100", LocalDate.now().minusDays(60), LocalDate.now().minusDays(45),
                    "OVERDUE", 50000.00, 10.0, 5000.00, 55000.00, 1L
            );

            // Create invoice line item
            jdbcTemplate.update(
                    "INSERT INTO invoice_line_items (id, invoice_id, product_id, product_name, product_sku, quantity_invoiced, unit_price, line_total) " +
                            "VALUES (?, ?, ?, ?, ?, ?, ?, ?) " +
                            "ON CONFLICT (id) DO NOTHING",
                    9101L, 9100L, 1L, "Test Product", "SKU001", 5.0, 10000.00, 50000.00
            );
        }
    }
}
