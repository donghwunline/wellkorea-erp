package com.wellkorea.backend.shared.test;

/**
 * Test fixtures providing sample data, tokens, and objects for tests.
 * Consolidates all test constants and fixtures in one place.
 * <p>
 * This interface provides a single source of truth for all test configuration values,
 * ensuring consistency across the test suite and making it easy to update
 * configuration in one place.
 * <p>
 * Usage:
 * <pre>
 * {@code
 * // In unit tests
 * JwtTokenProvider provider = new JwtTokenProvider(
 *     TestFixtures.JWT_SECRET,
 *     TestFixtures.JWT_EXPIRATION_MS
 * );
 *
 * // In integration tests (auto-configured via @DynamicPropertySource)
 * String token = jwtTokenProvider.generateToken("admin", Role.ADMIN.getAuthority());
 * }
 * </pre>
 */
public interface TestFixtures {

    // ========== JWT Configuration ==========

    /**
     * Test JWT secret key (256-bit minimum for HS256 algorithm).
     * Used across all JWT-related tests for consistency.
     * <p>
     * This secret is FOR TESTING ONLY and should never be used in production.
     */
    String JWT_SECRET = "test-secret-key-for-integration-tests-minimum-256-bits-required-for-hs256";

    /**
     * Test JWT expiration time in milliseconds (1 hour).
     */
    long JWT_EXPIRATION_MS = 3600000L;

    /**
     * An expired JWT token for testing token expiration handling.
     * This token was issued at 2021-01-01 00:00:00 and expired at 2021-01-01 00:00:01.
     */
    String EXPIRED_JWT_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbiIsInJvbGVzIjoiUk9MRV9BRE1JTiIsImlhdCI6MTYwOTQ1OTIwMCwiZXhwIjoxNjA5NDU5MjAxfQ.qQWx8x9K0s7qN8xN2w3V8H5F5";

    /**
     * An invalid/malformed JWT token for testing signature validation.
     */
    String INVALID_JWT_TOKEN = "invalid.jwt.token";

    // ========== Database Configuration ==========

    /**
     * PostgreSQL Docker image version for Testcontainers.
     * Using Alpine variant for smaller image size.
     */
    String POSTGRES_VERSION = "postgres:16-alpine";

    /**
     * Test database name.
     */
    String TEST_DB_NAME = "wellkorea_test";

    /**
     * Test database username.
     */
    String TEST_DB_USERNAME = "test";

    /**
     * Test database password.
     */
    String TEST_DB_PASSWORD = "test";

    // ========== MinIO Configuration ==========

    /**
     * MinIO container version (pinned for reproducibility).
     * Release date: 2024-12-13
     */
    String MINIO_VERSION = "minio/minio:RELEASE.2024-12-13T22-19-12Z";

    /**
     * MinIO test credentials (username).
     * Default MinIO root user for testing.
     */
    String MINIO_ROOT_USER = "minioadmin";

    /**
     * MinIO test credentials (password).
     * Default MinIO root password for testing.
     */
    String MINIO_ROOT_PASSWORD = "minioadmin";

    /**
     * MinIO test bucket name.
     * Created automatically by MinioFileStorage for testing.
     */
    String MINIO_BUCKET = "wellkorea-test";

    // ========== Test Entity IDs ==========

    /**
     * Standard test user ID for foreign key relationships.
     * Use this when inserting test data that references users table.
     */
    Long TEST_USER_ID = 1L;

    /**
     * Standard test customer ID for foreign key relationships.
     * Use this when inserting test data that references customers table.
     */
    Long TEST_CUSTOMER_ID = 1L;

    // ========== Test User Credentials ==========

    /**
     * Test admin username.
     */
    String ADMIN_USERNAME = "admin";

    /**
     * Test finance username.
     */
    String FINANCE_USERNAME = "finance";

    /**
     * Test sales username.
     */
    String SALES_USERNAME = "sales";

    /**
     * Test production username.
     */
    String PRODUCTION_USERNAME = "production";

    /**
     * Generic test username.
     */
    String TEST_USERNAME = "testuser";

    /**
     * Password for all test users (plain text).
     * BCrypt hash: $2a$10$iILF.Jz64XwbA5epmf3cg.BjFigBnCSq6kNZMFyksQTCn7dCqhMs6
     */
    String TEST_PASSWORD = "password123";

    /**
     * BCrypt hash of TEST_PASSWORD for database insertion.
     * Generated using BCryptPasswordEncoder with default strength (10 rounds).
     */
    String TEST_PASSWORD_HASH = "$2a$10$iILF.Jz64XwbA5epmf3cg.BjFigBnCSq6kNZMFyksQTCn7dCqhMs6";

    // ========== Note: Test Roles ==========
    // For role authority strings (e.g., "ROLE_ADMIN"), use the domain enum directly:
    // Role.ADMIN.getAuthority(), Role.FINANCE.getAuthority(), etc.
    // This ensures test code stays in sync with production role definitions.

    // ========== Sample API Responses ==========

    /**
     * Sample valid login request JSON.
     */
    String VALID_LOGIN_REQUEST = """
            {"username": "admin", "password": "password123"}
            """;

    /**
     * Sample login request with missing username.
     */
    String LOGIN_REQUEST_MISSING_USERNAME = """
            {"password": "password123"}
            """;

    /**
     * Sample login request with missing password.
     */
    String LOGIN_REQUEST_MISSING_PASSWORD = """
            {"username": "admin"}
            """;

    /**
     * Sample login request with empty username.
     */
    String LOGIN_REQUEST_EMPTY_USERNAME = """
            {"username": "", "password": "password123"}
            """;
}
