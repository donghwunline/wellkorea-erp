package com.wellkorea.backend.invoice.application;

import com.wellkorea.backend.BaseIntegrationTest;
import com.wellkorea.backend.invoice.api.dto.command.CreateInvoiceRequest;
import com.wellkorea.backend.invoice.api.dto.command.InvoiceLineItemRequest;
import com.wellkorea.backend.shared.lock.LockAcquisitionException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Concurrency tests for InvoiceCommandService.
 * <p>
 * Validates that the distributed lock ({@link com.wellkorea.backend.shared.lock.ProjectLock})
 * correctly prevents race conditions during concurrent invoice creation.
 * <p>
 * Test scenario: Multiple threads attempt to invoice the same products concurrently.
 * Expected behavior: Only invoices within the deliverable limit succeed; over-invoicing is prevented.
 */
@Tag("integration")
@DisplayName("Invoice Command Service Concurrency Tests")
class InvoiceCommandServiceConcurrencyTest extends BaseIntegrationTest {

    @Autowired
    private InvoiceCommandService invoiceCommandService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private static final Long TEST_PROJECT_ID = 9001L;
    private static final Long TEST_QUOTATION_ID = 9001L;
    private static final Long TEST_PRODUCT_ID = 9001L;
    private static final Long TEST_USER_ID = 1L;

    @BeforeEach
    void setUp() {
        // Insert test user
        jdbcTemplate.update(
                "INSERT INTO users (id, username, email, password_hash, full_name) " +
                        "VALUES (1, 'testuser', 'test@example.com', 'hash', 'Test User') " +
                        "ON CONFLICT (id) DO NOTHING"
        );

        // Insert test company
        jdbcTemplate.update(
                "INSERT INTO companies (id, name, contact_person, phone, email, is_active) " +
                        "VALUES (9001, 'Test Customer', 'John Doe', '123-456-7890', 'customer@example.com', true) " +
                        "ON CONFLICT (id) DO NOTHING"
        );
        jdbcTemplate.update(
                "INSERT INTO company_roles (company_id, role_type) VALUES (9001, 'CUSTOMER') " +
                        "ON CONFLICT (company_id, role_type) DO NOTHING"
        );

        // Insert test product type
        jdbcTemplate.update(
                "INSERT INTO product_types (id, name, created_at) " +
                        "VALUES (9001, 'Invoice Test Type', NOW()) " +
                        "ON CONFLICT (id) DO NOTHING"
        );

        // Insert test product
        jdbcTemplate.update(
                "INSERT INTO products (id, name, sku, product_type_id, base_unit_price, is_active, created_at, updated_at) " +
                        "VALUES (?, 'Concurrency Test Product', 'CONC-TEST', 9001, 1000.00, true, NOW(), NOW()) " +
                        "ON CONFLICT (id) DO NOTHING",
                TEST_PRODUCT_ID
        );

        // Insert test project
        String today = LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("MMdd"));
        String year = LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("yy"));
        jdbcTemplate.update(
                "INSERT INTO projects (id, job_code, customer_company_id, project_name, due_date, internal_owner_id, status, created_by_id) " +
                        "VALUES (?, ?, 9001, 'Concurrency Test Project', ?, 1, 'ACTIVE', 1) " +
                        "ON CONFLICT (id) DO NOTHING",
                TEST_PROJECT_ID, "WK2K" + year + "-9001-" + today, LocalDate.now().plusDays(30)
        );

        // Insert approved quotation with 10 units of test product
        jdbcTemplate.update(
                "INSERT INTO quotations (id, project_id, version, status, total_amount, quotation_date, validity_days, created_by_id) " +
                        "VALUES (?, ?, 1, 'APPROVED', 10000.00, ?, 30, 1) " +
                        "ON CONFLICT (id) DO NOTHING",
                TEST_QUOTATION_ID, TEST_PROJECT_ID, LocalDate.now()
        );
        jdbcTemplate.update(
                "INSERT INTO quotation_line_items (id, quotation_id, product_id, sequence, quantity, unit_price, line_total) " +
                        "VALUES (9001, ?, ?, 1, 10.0, 1000.00, 10000.00) " +
                        "ON CONFLICT (id) DO NOTHING",
                TEST_QUOTATION_ID, TEST_PRODUCT_ID
        );

        // Insert delivery of 10 units (all products delivered)
        jdbcTemplate.update(
                "INSERT INTO deliveries (id, project_id, quotation_id, delivery_date, status, delivered_by_id) " +
                        "VALUES (9001, ?, ?, ?, 'DELIVERED', 1) " +
                        "ON CONFLICT (id) DO NOTHING",
                TEST_PROJECT_ID, TEST_QUOTATION_ID, LocalDate.now()
        );
        jdbcTemplate.update(
                "INSERT INTO delivery_line_items (id, delivery_id, product_id, quantity_delivered) " +
                        "VALUES (9001, 9001, ?, 10.0) " +
                        "ON CONFLICT (id) DO NOTHING",
                TEST_PRODUCT_ID
        );
    }

    @Test
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    @DisplayName("Should prevent over-invoicing with concurrent requests")
    void shouldPreventOverInvoicingWithConcurrentRequests() throws Exception {
        // Given: 10 units delivered, 5 threads each trying to invoice 3 units = 15 total attempted
        // Only first ~3 should succeed (9 units), leaving 1 unit invoiceable
        int threadCount = 5;
        BigDecimal quantityPerRequest = new BigDecimal("3.0");
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failureCount = new AtomicInteger(0);
        AtomicInteger lockFailureCount = new AtomicInteger(0);

        try {
            // When: Execute concurrent invoice creation
            List<Callable<Boolean>> tasks = IntStream.range(0, threadCount)
                    .<Callable<Boolean>>mapToObj(i -> () -> {
                        try {
                            CreateInvoiceRequest request = new CreateInvoiceRequest(
                                    TEST_PROJECT_ID,
                                    TEST_QUOTATION_ID,
                                    null, // deliveryId (optional)
                                    LocalDate.now(),
                                    LocalDate.now().plusDays(30),
                                    new BigDecimal("10.0"),
                                    null,
                                    List.of(new InvoiceLineItemRequest(
                                            TEST_PRODUCT_ID,
                                            "Concurrency Test Product",
                                            "CONC-TEST",
                                            quantityPerRequest,
                                            new BigDecimal("1000.00")
                                    ))
                            );
                            invoiceCommandService.createInvoice(TEST_PROJECT_ID, request, TEST_USER_ID);
                            successCount.incrementAndGet();
                            return true;
                        } catch (LockAcquisitionException e) {
                            lockFailureCount.incrementAndGet();
                            return false;
                        } catch (Exception e) {
                            // Business validation failure (over-invoicing)
                            failureCount.incrementAndGet();
                            return false;
                        }
                    })
                    .toList();

            List<Future<Boolean>> futures = executor.invokeAll(tasks, 60, TimeUnit.SECONDS);

            // Wait for all tasks to complete
            List<Boolean> results = new ArrayList<>();
            for (Future<Boolean> future : futures) {
                if (!future.isCancelled()) {
                    results.add(future.get());
                }
            }

            // Then: Verify no over-invoicing occurred
            // Max invoiceable = 10 units, each request = 3 units
            // At most 3 requests can succeed (9 units), 4th would exceed limit
            assertThat(successCount.get())
                    .as("At most 3 invoices should succeed (9 units out of 10 deliverable)")
                    .isLessThanOrEqualTo(3);

            assertThat(successCount.get() + failureCount.get() + lockFailureCount.get())
                    .as("All threads should complete (success or failure)")
                    .isEqualTo(threadCount);

            // Verify total invoiced quantity does not exceed delivered quantity
            BigDecimal totalInvoiced = jdbcTemplate.queryForObject(
                    "SELECT COALESCE(SUM(ili.quantity_invoiced), 0) " +
                            "FROM invoice_line_items ili " +
                            "JOIN tax_invoices ti ON ili.invoice_id = ti.id " +
                            "WHERE ti.project_id = ? AND ti.status != 'CANCELLED'",
                    BigDecimal.class,
                    TEST_PROJECT_ID
            );

            assertThat(totalInvoiced)
                    .as("Total invoiced should not exceed delivered quantity (10)")
                    .isLessThanOrEqualTo(new BigDecimal("10.0"));

            System.out.printf("Concurrency test results: %d succeeded, %d failed (business), %d failed (lock)%n",
                    successCount.get(), failureCount.get(), lockFailureCount.get());

        } finally {
            executor.shutdown();
            executor.awaitTermination(5, TimeUnit.SECONDS);
        }
    }

    @Test
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    @DisplayName("Should allow sequential invoice creation within limits")
    void shouldAllowSequentialInvoiceCreationWithinLimits() {
        // Given: 10 units delivered
        // When: Create two invoices sequentially, 4 units each = 8 total
        CreateInvoiceRequest request1 = new CreateInvoiceRequest(
                TEST_PROJECT_ID,
                TEST_QUOTATION_ID,
                null, // deliveryId (optional)
                LocalDate.now(),
                LocalDate.now().plusDays(30),
                new BigDecimal("10.0"),
                null,
                List.of(new InvoiceLineItemRequest(
                        TEST_PRODUCT_ID,
                        "Concurrency Test Product",
                        "CONC-TEST",
                        new BigDecimal("4.0"),
                        new BigDecimal("1000.00")
                ))
        );

        Long invoiceId1 = invoiceCommandService.createInvoice(TEST_PROJECT_ID, request1, TEST_USER_ID);
        assertThat(invoiceId1).isNotNull();

        CreateInvoiceRequest request2 = new CreateInvoiceRequest(
                TEST_PROJECT_ID,
                TEST_QUOTATION_ID,
                null, // deliveryId (optional)
                LocalDate.now(),
                LocalDate.now().plusDays(30),
                new BigDecimal("10.0"),
                null,
                List.of(new InvoiceLineItemRequest(
                        TEST_PRODUCT_ID,
                        "Concurrency Test Product",
                        "CONC-TEST",
                        new BigDecimal("4.0"),
                        new BigDecimal("1000.00")
                ))
        );

        Long invoiceId2 = invoiceCommandService.createInvoice(TEST_PROJECT_ID, request2, TEST_USER_ID);
        assertThat(invoiceId2).isNotNull();

        // Then: Both should succeed (8 total < 10 delivered)
        BigDecimal totalInvoiced = jdbcTemplate.queryForObject(
                "SELECT COALESCE(SUM(ili.quantity_invoiced), 0) " +
                        "FROM invoice_line_items ili " +
                        "JOIN tax_invoices ti ON ili.invoice_id = ti.id " +
                        "WHERE ti.project_id = ? AND ti.status != 'CANCELLED'",
                BigDecimal.class,
                TEST_PROJECT_ID
        );

        assertThat(totalInvoiced).isEqualByComparingTo(new BigDecimal("8.0"));
    }

    @Test
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    @DisplayName("Should exclude RETURNED deliveries from invoiceable quantity calculation")
    void shouldExcludeReturnedDeliveriesFromInvoiceableQuantity() {
        // Given: Setup a scenario with both DELIVERED and RETURNED deliveries
        // - Delivery 9001: 10 units DELIVERED (from setUp)
        // - Delivery 9002: 5 units RETURNED (should be excluded)
        // - Net invoiceable: 10 units (not 15)

        // Insert a RETURNED delivery with 5 units
        jdbcTemplate.update(
                "INSERT INTO deliveries (id, project_id, quotation_id, delivery_date, status, delivered_by_id) " +
                        "VALUES (9002, ?, ?, ?, 'RETURNED', 1) " +
                        "ON CONFLICT (id) DO NOTHING",
                TEST_PROJECT_ID, TEST_QUOTATION_ID, LocalDate.now()
        );
        jdbcTemplate.update(
                "INSERT INTO delivery_line_items (id, delivery_id, product_id, quantity_delivered) " +
                        "VALUES (9002, 9002, ?, 5.0) " +
                        "ON CONFLICT (id) DO NOTHING",
                TEST_PRODUCT_ID
        );

        // When: Try to invoice 10 units (exactly what was DELIVERED, excluding RETURNED)
        CreateInvoiceRequest validRequest = new CreateInvoiceRequest(
                TEST_PROJECT_ID,
                TEST_QUOTATION_ID,
                null,
                LocalDate.now(),
                LocalDate.now().plusDays(30),
                new BigDecimal("10.0"),
                null,
                List.of(new InvoiceLineItemRequest(
                        TEST_PRODUCT_ID,
                        "Concurrency Test Product",
                        "CONC-TEST",
                        new BigDecimal("10.0"), // Exactly the DELIVERED quantity
                        new BigDecimal("1000.00")
                ))
        );

        // Then: Should succeed since RETURNED delivery is excluded
        Long invoiceId = invoiceCommandService.createInvoice(TEST_PROJECT_ID, validRequest, TEST_USER_ID);
        assertThat(invoiceId).isNotNull();

        // Verify the invoiced quantity
        BigDecimal totalInvoiced = jdbcTemplate.queryForObject(
                "SELECT COALESCE(SUM(ili.quantity_invoiced), 0) " +
                        "FROM invoice_line_items ili " +
                        "JOIN tax_invoices ti ON ili.invoice_id = ti.id " +
                        "WHERE ti.project_id = ? AND ti.status != 'CANCELLED'",
                BigDecimal.class,
                TEST_PROJECT_ID
        );
        assertThat(totalInvoiced).isEqualByComparingTo(new BigDecimal("10.0"));

        // Verify that trying to invoice more than the net delivered quantity fails
        // (this confirms RETURNED deliveries are not counted)
        CreateInvoiceRequest invalidRequest = new CreateInvoiceRequest(
                TEST_PROJECT_ID,
                TEST_QUOTATION_ID,
                null,
                LocalDate.now(),
                LocalDate.now().plusDays(30),
                new BigDecimal("10.0"),
                null,
                List.of(new InvoiceLineItemRequest(
                        TEST_PRODUCT_ID,
                        "Concurrency Test Product",
                        "CONC-TEST",
                        new BigDecimal("1.0"), // Any additional amount should fail
                        new BigDecimal("1000.00")
                ))
        );

        org.assertj.core.api.Assertions.assertThatThrownBy(() ->
                        invoiceCommandService.createInvoice(TEST_PROJECT_ID, invalidRequest, TEST_USER_ID))
                .isInstanceOf(com.wellkorea.backend.shared.exception.BusinessException.class)
                .hasMessageContaining("exceeds invoiceable quantity");
    }
}
