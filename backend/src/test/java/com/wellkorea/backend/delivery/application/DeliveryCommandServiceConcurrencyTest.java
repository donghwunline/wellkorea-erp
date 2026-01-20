package com.wellkorea.backend.delivery.application;

import com.wellkorea.backend.BaseIntegrationTest;
import com.wellkorea.backend.delivery.api.dto.command.CreateDeliveryRequest;
import com.wellkorea.backend.delivery.api.dto.command.DeliveryLineItemRequest;
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
 * Concurrency tests for DeliveryCommandService.
 * <p>
 * Validates that the distributed lock ({@link com.wellkorea.backend.shared.lock.ProjectLock})
 * correctly prevents race conditions during concurrent delivery creation.
 * <p>
 * Test scenario: Multiple threads attempt to deliver the same products concurrently.
 * Expected behavior: Only deliveries within the quotation limit succeed; over-delivery is prevented.
 */
@Tag("integration")
@DisplayName("Delivery Command Service Concurrency Tests")
class DeliveryCommandServiceConcurrencyTest extends BaseIntegrationTest {

    @Autowired
    private DeliveryCommandService deliveryCommandService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private static final Long TEST_PROJECT_ID = 8001L;
    private static final Long TEST_QUOTATION_ID = 8001L;
    private static final Long TEST_PRODUCT_ID = 8001L;
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
                        "VALUES (8001, 'Test Customer', 'John Doe', '123-456-7890', 'customer@example.com', true) " +
                        "ON CONFLICT (id) DO NOTHING"
        );
        jdbcTemplate.update(
                "INSERT INTO company_roles (company_id, role_type) VALUES (8001, 'CUSTOMER') " +
                        "ON CONFLICT (company_id, role_type) DO NOTHING"
        );

        // Insert test product type
        jdbcTemplate.update(
                "INSERT INTO product_types (id, name, created_at) " +
                        "VALUES (8001, 'Delivery Test Type', NOW()) " +
                        "ON CONFLICT (id) DO NOTHING"
        );

        // Insert test product
        jdbcTemplate.update(
                "INSERT INTO products (id, name, sku, product_type_id, base_unit_price, is_active, created_at, updated_at) " +
                        "VALUES (?, 'Delivery Concurrency Test Product', 'DEL-CONC-TEST', 8001, 1000.00, true, NOW(), NOW()) " +
                        "ON CONFLICT (id) DO NOTHING",
                TEST_PRODUCT_ID
        );

        // Insert test project
        String today = LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("MMdd"));
        String year = LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("yy"));
        jdbcTemplate.update(
                "INSERT INTO projects (id, job_code, customer_company_id, project_name, due_date, internal_owner_id, status, created_by_id) " +
                        "VALUES (?, ?, 8001, 'Delivery Concurrency Test Project', ?, 1, 'ACTIVE', 1) " +
                        "ON CONFLICT (id) DO NOTHING",
                TEST_PROJECT_ID, "WK2K" + year + "-8001-" + today, LocalDate.now().plusDays(30)
        );

        // Insert approved quotation with 10 units of test product
        jdbcTemplate.update(
                "INSERT INTO quotations (id, project_id, version, status, total_amount, quotation_date, validity_days, created_by_id) " +
                        "VALUES (?, ?, 1, 'ACCEPTED', 10000.00, ?, 30, 1) " +
                        "ON CONFLICT (id) DO NOTHING",
                TEST_QUOTATION_ID, TEST_PROJECT_ID, LocalDate.now()
        );
        jdbcTemplate.update(
                "INSERT INTO quotation_line_items (id, quotation_id, product_id, sequence, quantity, unit_price, line_total) " +
                        "VALUES (8001, ?, ?, 1, 10.0, 1000.00, 10000.00) " +
                        "ON CONFLICT (id) DO NOTHING",
                TEST_QUOTATION_ID, TEST_PRODUCT_ID
        );
    }

    @Test
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    @DisplayName("Should prevent over-delivery with concurrent requests")
    void shouldPreventOverDeliveryWithConcurrentRequests() throws Exception {
        // Given: Quotation for 10 units, 5 threads each trying to deliver 3 units = 15 total attempted
        // Only first ~3 should succeed (9 units), leaving 1 unit deliverable
        int threadCount = 5;
        double quantityPerRequest = 3.0;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failureCount = new AtomicInteger(0);
        AtomicInteger lockFailureCount = new AtomicInteger(0);
        BigDecimal quantityBigDecimal = new BigDecimal(String.valueOf(quantityPerRequest));

        try {
            // When: Execute concurrent delivery creation
            List<Callable<Boolean>> tasks = IntStream.range(0, threadCount)
                    .<Callable<Boolean>>mapToObj(i -> () -> {
                        try {
                            CreateDeliveryRequest request = new CreateDeliveryRequest(
                                    TEST_QUOTATION_ID,
                                    LocalDate.now(),
                                    List.of(new DeliveryLineItemRequest(
                                            TEST_PRODUCT_ID,
                                            quantityBigDecimal
                                    )),
                                    "Concurrent delivery test " + i
                            );
                            deliveryCommandService.createDelivery(TEST_PROJECT_ID, request, TEST_USER_ID);
                            successCount.incrementAndGet();
                            return true;
                        } catch (LockAcquisitionException e) {
                            lockFailureCount.incrementAndGet();
                            return false;
                        } catch (Exception e) {
                            // Business validation failure (over-delivery)
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

            // Then: Verify no over-delivery occurred
            // Max deliverable = 10 units, each request = 3 units
            // At most 3 requests can succeed (9 units), 4th would exceed limit
            assertThat(successCount.get())
                    .as("At most 3 deliveries should succeed (9 units out of 10 in quotation)")
                    .isLessThanOrEqualTo(3);

            assertThat(successCount.get() + failureCount.get() + lockFailureCount.get())
                    .as("All threads should complete (success or failure)")
                    .isEqualTo(threadCount);

            // Verify total delivered quantity does not exceed quotation quantity
            BigDecimal totalDelivered = jdbcTemplate.queryForObject(
                    "SELECT COALESCE(SUM(dli.quantity_delivered), 0) " +
                            "FROM delivery_line_items dli " +
                            "JOIN deliveries d ON dli.delivery_id = d.id " +
                            "WHERE d.project_id = ? AND d.status != 'RETURNED'",
                    BigDecimal.class,
                    TEST_PROJECT_ID
            );

            assertThat(totalDelivered)
                    .as("Total delivered should not exceed quotation quantity (10)")
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
    @DisplayName("Should allow sequential delivery creation within limits")
    void shouldAllowSequentialDeliveryCreationWithinLimits() {
        // Use different IDs for this test to ensure isolation from concurrent test
        Long seqProjectId = 8002L;
        Long seqQuotationId = 8002L;
        Long seqProductId = 8002L;

        // Setup separate test data for sequential test
        jdbcTemplate.update(
                "INSERT INTO product_types (id, name, created_at) " +
                        "VALUES (8002, 'Delivery Sequential Test Type', NOW()) " +
                        "ON CONFLICT (id) DO NOTHING"
        );
        jdbcTemplate.update(
                "INSERT INTO products (id, name, sku, product_type_id, base_unit_price, is_active, created_at, updated_at) " +
                        "VALUES (?, 'Delivery Sequential Test Product', 'DEL-SEQ-TEST', 8002, 1000.00, true, NOW(), NOW()) " +
                        "ON CONFLICT (id) DO NOTHING",
                seqProductId
        );
        String today = LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("MMdd"));
        String year = LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("yy"));
        jdbcTemplate.update(
                "INSERT INTO projects (id, job_code, customer_company_id, project_name, due_date, internal_owner_id, status, created_by_id) " +
                        "VALUES (?, ?, 8001, 'Delivery Sequential Test Project', ?, 1, 'ACTIVE', 1) " +
                        "ON CONFLICT (id) DO NOTHING",
                seqProjectId, "WK2K" + year + "-8002-" + today, LocalDate.now().plusDays(30)
        );
        jdbcTemplate.update(
                "INSERT INTO quotations (id, project_id, version, status, total_amount, quotation_date, validity_days, created_by_id) " +
                        "VALUES (?, ?, 1, 'ACCEPTED', 10000.00, ?, 30, 1) " +
                        "ON CONFLICT (id) DO NOTHING",
                seqQuotationId, seqProjectId, LocalDate.now()
        );
        jdbcTemplate.update(
                "INSERT INTO quotation_line_items (id, quotation_id, product_id, sequence, quantity, unit_price, line_total) " +
                        "VALUES (8002, ?, ?, 1, 10.0, 1000.00, 10000.00) " +
                        "ON CONFLICT (id) DO NOTHING",
                seqQuotationId, seqProductId
        );

        // Given: Quotation for 10 units
        // When: Create two deliveries sequentially, 4 units each = 8 total
        BigDecimal fourUnits = new BigDecimal("4.0");
        CreateDeliveryRequest request1 = new CreateDeliveryRequest(
                seqQuotationId,
                LocalDate.now(),
                List.of(new DeliveryLineItemRequest(seqProductId, fourUnits)),
                "First delivery"
        );

        Long deliveryId1 = deliveryCommandService.createDelivery(seqProjectId, request1, TEST_USER_ID);
        assertThat(deliveryId1).isNotNull();

        CreateDeliveryRequest request2 = new CreateDeliveryRequest(
                seqQuotationId,
                LocalDate.now(),
                List.of(new DeliveryLineItemRequest(seqProductId, fourUnits)),
                "Second delivery"
        );

        Long deliveryId2 = deliveryCommandService.createDelivery(seqProjectId, request2, TEST_USER_ID);
        assertThat(deliveryId2).isNotNull();

        // Then: Both should succeed (8 total < 10 in quotation)
        BigDecimal totalDelivered = jdbcTemplate.queryForObject(
                "SELECT COALESCE(SUM(dli.quantity_delivered), 0) " +
                        "FROM delivery_line_items dli " +
                        "JOIN deliveries d ON dli.delivery_id = d.id " +
                        "WHERE d.project_id = ? AND d.status != 'RETURNED'",
                BigDecimal.class,
                seqProjectId
        );

        assertThat(totalDelivered).isEqualByComparingTo(new BigDecimal("8.0"));
    }
}
