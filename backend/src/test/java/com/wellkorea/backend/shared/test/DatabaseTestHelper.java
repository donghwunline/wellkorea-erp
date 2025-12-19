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
                TestFixtures.TEST_USER_ID,
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
                TestFixtures.TEST_CUSTOMER_ID,
                "Test Customer",
                "John Doe",
                "123-456-7890",
                "customer@example.com"
        );
    }

    /**
     * Inserts all test users with their role assignments.
     * Password for all test users: "password123" (BCrypt hash from TestFixtures.TEST_PASSWORD_HASH)
     * <p>
     * Users created:
     * - admin (ID: 1) - All roles (ADMIN, FINANCE, PRODUCTION, SALES)
     * - finance (ID: 2) - FINANCE role
     * - production (ID: 3) - PRODUCTION role
     * - sales (ID: 4) - SALES role
     * - sales2 (ID: 5) - SALES role
     * <p>
     * Prerequisites: Roles table must be populated (automatically done by V5 migration).
     *
     * @param jdbcTemplate Spring JDBC template
     */
    public static void insertTestUsersWithRoles(JdbcTemplate jdbcTemplate) {
        // BCrypt hash of "password123" - must match TestFixtures.TEST_PASSWORD_HASH
        String passwordHash = "$2a$10$iILF.Jz64XwbA5epmf3cg.BjFigBnCSq6kNZMFyksQTCn7dCqhMs6";

        // Insert users
        jdbcTemplate.update(
                "INSERT INTO users (id, username, email, password_hash, full_name, is_active) " +
                        "VALUES (1, 'admin', 'admin@wellkorea.com', '" + passwordHash + "', 'Admin User', true), " +
                        "       (2, 'finance', 'finance@wellkorea.com', '" + passwordHash + "', 'Finance Manager', true), " +
                        "       (3, 'production', 'production@wellkorea.com', '" + passwordHash + "', 'Production Lead', true), " +
                        "       (4, 'sales', 'sales@wellkorea.com', '" + passwordHash + "', 'Sales Representative', true), " +
                        "       (5, 'sales2', 'sales2@wellkorea.com', '" + passwordHash + "', 'Sales Representative 2', true) " +
                        "ON CONFLICT (id) DO NOTHING"
        );

        // Reset sequence for users table
        jdbcTemplate.execute("SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 0) FROM users))");

        // Insert user-role assignments
        jdbcTemplate.update(
                "INSERT INTO user_roles (user_id, role_name) " +
                        "VALUES " +
                        "    (1, 'ADMIN'), " +
                        "    (1, 'FINANCE'), " +
                        "    (1, 'PRODUCTION'), " +
                        "    (1, 'SALES'), " +
                        "    (2, 'FINANCE'), " +
                        "    (3, 'PRODUCTION'), " +
                        "    (4, 'SALES'), " +
                        "    (5, 'SALES') " +
                        "ON CONFLICT (user_id, role_name) DO NOTHING"
        );

        // Insert customer assignments (FR-062: Sales role customer filtering)
        // sales user (id=4) -> Samsung, Hyundai, LG
        // sales2 user (id=5) -> SK Hynix, Doosan, POSCO
        jdbcTemplate.update(
                "INSERT INTO customer_assignments (user_id, customer_id) " +
                        "VALUES (4, 1), (4, 2), (4, 3), (5, 4), (5, 5), (5, 6) " +
                        "ON CONFLICT DO NOTHING"
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
     * Inserts complete test dataset including users with roles and customer.
     * Convenience method for integration tests requiring full test data.
     * Prerequisites: Roles table must be populated (automatically done by V5 migration).
     *
     * @param jdbcTemplate Spring JDBC template
     */
    public static void insertCompleteTestData(JdbcTemplate jdbcTemplate) {
        insertTestUsersWithRoles(jdbcTemplate);
        insertTestCustomer(jdbcTemplate);
    }

    /**
     * Inserts test products for quotation tests.
     * Products created:
     * - Product 1: Control Panel - Sheet Metal Parts (Type 1) - Base price 50000.00
     * - Product 2: L-Bracket - Sheet Metal Parts (Type 1) - Base price 3500.00
     * - Product 3: Enclosure - Custom Enclosures (Type 4) - Base price 150000.00
     *
     * @param jdbcTemplate Spring JDBC template
     */
    public static void insertTestProducts(JdbcTemplate jdbcTemplate) {
        jdbcTemplate.update(
                "INSERT INTO products (id, sku, name, product_type_id, base_unit_price, unit) " +
                        "VALUES (1, 'SM-PANEL-001', 'Control Panel', 1, 50000.00, 'EA'), " +
                        "       (2, 'SM-BRACKET-001', 'L-Bracket', 1, 3500.00, 'EA'), " +
                        "       (3, 'SM-ENCLOSURE-001', 'Enclosure', 4, 150000.00, 'EA') " +
                        "ON CONFLICT (id) DO NOTHING"
        );

        // Reset sequence
        jdbcTemplate.execute("SELECT setval('products_id_seq', (SELECT COALESCE(MAX(id), 0) FROM products))");
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
