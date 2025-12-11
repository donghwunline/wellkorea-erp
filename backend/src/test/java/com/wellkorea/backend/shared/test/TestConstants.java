package com.wellkorea.backend.shared.test;

/**
 * Legacy test constants class for backwards compatibility.
 * Delegates to {@link TestFixtures} interface for all values.
 * <p>
 * New code should use {@link TestFixtures} directly.
 * <p>
 *
 * @deprecated Use {@link TestFixtures} interface instead for new code.
 */
@Deprecated(since = "1.0", forRemoval = false)
public final class TestConstants implements TestFixtures {

    private TestConstants() {
        // Utility class - prevent instantiation
        throw new UnsupportedOperationException("This is a utility class and cannot be instantiated");
    }

    // All constants are now defined in TestFixtures interface.
    // This class provides static access for backwards compatibility.

    // ========== JWT Configuration ==========
    public static final String JWT_SECRET = TestFixtures.JWT_SECRET;
    public static final long JWT_EXPIRATION_MS = TestFixtures.JWT_EXPIRATION_MS;
    public static final String EXPIRED_JWT_TOKEN = TestFixtures.EXPIRED_JWT_TOKEN;
    public static final String INVALID_JWT_TOKEN = TestFixtures.INVALID_JWT_TOKEN;

    // ========== Database Configuration ==========
    public static final String POSTGRES_VERSION = TestFixtures.POSTGRES_VERSION;
    public static final String TEST_DB_NAME = TestFixtures.TEST_DB_NAME;
    public static final String TEST_DB_USERNAME = TestFixtures.TEST_DB_USERNAME;
    public static final String TEST_DB_PASSWORD = TestFixtures.TEST_DB_PASSWORD;

    // ========== MinIO Configuration ==========
    public static final String MINIO_VERSION = TestFixtures.MINIO_VERSION;
    public static final String MINIO_ROOT_USER = TestFixtures.MINIO_ROOT_USER;
    public static final String MINIO_ROOT_PASSWORD = TestFixtures.MINIO_ROOT_PASSWORD;
    public static final String MINIO_BUCKET = TestFixtures.MINIO_BUCKET;

    // ========== Test Entity IDs ==========
    public static final Long TEST_USER_ID = TestFixtures.TEST_USER_ID;
    public static final Long TEST_CUSTOMER_ID = TestFixtures.TEST_CUSTOMER_ID;

    // ========== Test User Credentials ==========
    public static final String ADMIN_USERNAME = TestFixtures.ADMIN_USERNAME;
    public static final String FINANCE_USERNAME = TestFixtures.FINANCE_USERNAME;
    public static final String SALES_USERNAME = TestFixtures.SALES_USERNAME;
    public static final String PRODUCTION_USERNAME = TestFixtures.PRODUCTION_USERNAME;
    public static final String TEST_USERNAME = TestFixtures.TEST_USERNAME;
    public static final String TEST_PASSWORD = TestFixtures.TEST_PASSWORD;
    public static final String TEST_PASSWORD_HASH = TestFixtures.TEST_PASSWORD_HASH;
}
