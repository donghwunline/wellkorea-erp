package com.wellkorea.backend.shared.test;

import org.springframework.jdbc.core.JdbcTemplate;

/**
 * Helper methods for database test setup.
 * Reduces boilerplate in integration tests requiring test data.
 * <p>
 * Usage:
 * <pre>
 * {@code
 * @BeforeEach
 * void setUp() {
 *     DatabaseTestHelper.insertStandardTestData(jdbcTemplate);
 * }
 * }
 * </pre>
 */
public final class DatabaseTestHelper {

    private DatabaseTestHelper() {
        // Utility class - prevent instantiation
        throw new UnsupportedOperationException("This is a utility class and cannot be instantiated");
    }

    /**
     * Inserts standard test user (idempotent).
     * Used for foreign key constraints in project/quotation tests.
     *
     * @param jdbcTemplate Spring JDBC template
     */
    public static void insertTestUser(JdbcTemplate jdbcTemplate) {
        jdbcTemplate.update(
                "INSERT INTO users (id, username, email, password_hash, full_name) " +
                        "VALUES (?, ?, ?, ?, ?) " +
                        "ON CONFLICT (id) DO NOTHING",
                TestConstants.TEST_USER_ID,
                "testuser",
                "test@example.com",
                "$2a$10$dummyHashForTestingPurposes",  // BCrypt hash
                "Test User"
        );
    }

    /**
     * Inserts standard test customer (idempotent).
     * Used for foreign key constraints in project tests.
     *
     * @param jdbcTemplate Spring JDBC template
     */
    public static void insertTestCustomer(JdbcTemplate jdbcTemplate) {
        jdbcTemplate.update(
                "INSERT INTO customers (id, name, contact_person, phone, email) " +
                        "VALUES (?, ?, ?, ?, ?) " +
                        "ON CONFLICT (id) DO NOTHING",
                TestConstants.TEST_CUSTOMER_ID,
                "Test Customer",
                "John Doe",
                "123-456-7890",
                "customer@example.com"
        );
    }

    /**
     * Inserts both test user and customer (common setup).
     * Convenience method for tests that need both entities.
     *
     * @param jdbcTemplate Spring JDBC template
     */
    public static void insertStandardTestData(JdbcTemplate jdbcTemplate) {
        insertTestUser(jdbcTemplate);
        insertTestCustomer(jdbcTemplate);
    }

    /**
     * Truncates a table (for cleanup in tests).
     * Use cautiously - only for test isolation.
     *
     * @param jdbcTemplate Spring JDBC template
     * @param tableName    Name of the table to truncate
     */
    public static void truncateTable(JdbcTemplate jdbcTemplate, String tableName) {
        jdbcTemplate.execute("TRUNCATE TABLE " + tableName + " CASCADE");
    }

    /**
     * Counts rows in a table (for test assertions).
     *
     * @param jdbcTemplate Spring JDBC template
     * @param tableName    Name of the table to count
     * @return Number of rows in the table
     */
    public static int countRows(JdbcTemplate jdbcTemplate, String tableName) {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM " + tableName, Integer.class);
        return count != null ? count : 0;
    }
}
