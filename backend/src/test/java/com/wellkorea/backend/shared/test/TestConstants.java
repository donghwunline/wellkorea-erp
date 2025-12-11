package com.wellkorea.backend.shared.test;

import com.wellkorea.backend.auth.domain.Role;

/**
 * Centralized test constants for consistent test configuration.
 * Eliminates duplication across unit and integration tests.
 * <p>
 * This class provides a single source of truth for all test configuration values,
 * ensuring consistency across the test suite and making it easy to update
 * configuration in one place.
 * <p>
 * Usage:
 * <pre>
 * {@code
 * // In unit tests
 * JwtTokenProvider provider = new JwtTokenProvider(
 *     TestConstants.JWT_SECRET,
 *     TestConstants.JWT_EXPIRATION_MS
 * );
 *
 * // In integration tests (auto-configured via @DynamicPropertySource)
 * String token = jwtTokenProvider.generateToken("admin", Role.ADMIN.getAuthority());
 * }
 * </pre>
 */
public final class TestConstants {

    private TestConstants() {
        // Utility class - prevent instantiation
        throw new UnsupportedOperationException("This is a utility class and cannot be instantiated");
    }

    // ========== JWT Configuration ==========

    /**
     * Test JWT secret key (256-bit minimum for HS256 algorithm).
     * Used across all JWT-related tests for consistency.
     * <p>
     * This secret is FOR TESTING ONLY and should never be used in production.
     */
    public static final String JWT_SECRET =
            "test-secret-key-for-integration-tests-minimum-256-bits-required-for-hs256";

    /**
     * Test JWT expiration time in milliseconds (1 hour).
     */
    public static final long JWT_EXPIRATION_MS = 3600000L;

    // ========== Database Configuration ==========

    /**
     * PostgreSQL Docker image version for Testcontainers.
     * Using Alpine variant for smaller image size.
     */
    public static final String POSTGRES_VERSION = "postgres:16-alpine";

    /**
     * Test database name.
     */
    public static final String TEST_DB_NAME = "wellkorea_test";

    /**
     * Test database username.
     */
    public static final String TEST_DB_USERNAME = "test";

    /**
     * Test database password.
     */
    public static final String TEST_DB_PASSWORD = "test";

    // ========== MinIO Configuration ==========

    /**
     * MinIO container version (pinned for reproducibility).
     * Release date: 2024-12-13
     */
    public static final String MINIO_VERSION = "minio/minio:RELEASE.2024-12-13T22-19-12Z";

    /**
     * MinIO test credentials (username).
     * Default MinIO root user for testing.
     */
    public static final String MINIO_ROOT_USER = "minioadmin";

    /**
     * MinIO test credentials (password).
     * Default MinIO root password for testing.
     */
    public static final String MINIO_ROOT_PASSWORD = "minioadmin";

    /**
     * MinIO test bucket name.
     * Created automatically by MinioFileStorage for testing.
     */
    public static final String MINIO_BUCKET = "wellkorea-test";

    // ========== Test Entity IDs ==========

    /**
     * Standard test user ID for foreign key relationships.
     * Use this when inserting test data that references users table.
     */
    public static final Long TEST_USER_ID = 1L;

    /**
     * Standard test customer ID for foreign key relationships.
     * Use this when inserting test data that references customers table.
     */
    public static final Long TEST_CUSTOMER_ID = 1L;

    // ========== Test User Credentials ==========

    /**
     * Test admin username.
     */
    public static final String ADMIN_USERNAME = "admin";

    /**
     * Test finance username.
     */
    public static final String FINANCE_USERNAME = "finance";

    /**
     * Test sales username.
     */
    public static final String SALES_USERNAME = "sales";

    /**
     * Test production username.
     */
    public static final String PRODUCTION_USERNAME = "production";

    /**
     * Generic test username.
     */
    public static final String TEST_USERNAME = "testuser";

    // ========== Note: Test Roles ==========
    // For role authority strings (e.g., "ROLE_ADMIN"), use the domain enum directly:
    // Role.ADMIN.getAuthority(), Role.FINANCE.getAuthority(), etc.
    // This ensures test code stays in sync with production role definitions.
}
