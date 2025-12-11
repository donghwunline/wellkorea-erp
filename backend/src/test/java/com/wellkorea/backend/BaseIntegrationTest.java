package com.wellkorea.backend;

import com.wellkorea.backend.shared.test.TestConstants;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.containers.wait.strategy.HttpWaitStrategy;

/**
 * Base class for integration tests with Testcontainers.
 * Provides singleton PostgreSQL and MinIO containers using modern Spring Boot 3.1+ patterns.
 * <p>
 * PostgreSQL uses {@link ServiceConnection} for automatic Spring Boot datasource configuration.
 * MinIO requires manual {@link DynamicPropertySource} until Spring Boot adds native support.
 * <p>
 * Containers are started once per JVM in a static initializer block and reused
 * across all test classes, ensuring stable port mappings and reliable test execution.
 * <p>
 * This pattern solves issues where tests pass individually but fail when run together
 * by guaranteeing containers are fully started before Spring context initialization.
 * <p>
 * Usage: Extend this class in your integration tests.
 * <p>
 * Example:
 * <pre>
 * {@code
 * @Tag("integration") // Add JUnit tag for test categorization
 * @AutoConfigureMockMvc // Add if you need MockMvc for HTTP testing
 * class MyIntegrationTest extends BaseIntegrationTest {
 *     // Test methods
 * }
 * }
 * </pre>
 */
@SpringBootTest
@ActiveProfiles("test")
public abstract class BaseIntegrationTest {

    /**
     * PostgreSQL 16 container for database integration tests.
     * Singleton container started once per JVM, reused across all tests.
     * <p>
     * {@link ServiceConnection} automatically configures Spring Boot's DataSource
     * properties (spring.datasource.url, username, password) from this container.
     * No manual {@link DynamicPropertySource} configuration needed for PostgreSQL.
     */
    @ServiceConnection
    private static final PostgreSQLContainer<?> postgres;

    /**
     * MinIO container for S3-compatible storage integration tests.
     * Singleton container started once per JVM, reused across all tests.
     * Pinned to specific release for deterministic builds.
     * <p>
     * MinIO requires manual {@link DynamicPropertySource} configuration as Spring Boot
     * does not provide native {@link ServiceConnection} support for MinIO yet.
     */
    private static final GenericContainer<?> minio;

    /*
     * Static initializer block - containers start before any test class loads.
     * This ensures containers are fully running before Spring context initialization,
     * preventing race conditions and port mapping issues.
     */
    static {
        // Initialize and start PostgreSQL container
        // @ServiceConnection will auto-configure datasource properties
        postgres = new PostgreSQLContainer<>(TestConstants.POSTGRES_VERSION)
                .withDatabaseName(TestConstants.TEST_DB_NAME)
                .withUsername(TestConstants.TEST_DB_USERNAME)
                .withPassword(TestConstants.TEST_DB_PASSWORD)
                .withReuse(true);  // Reuse containers for faster local development
        postgres.start();

        // Initialize and start MinIO container
        minio = new GenericContainer<>(TestConstants.MINIO_VERSION)
                .withExposedPorts(9000)
                .withEnv("MINIO_ROOT_USER", TestConstants.MINIO_ROOT_USER)
                .withEnv("MINIO_ROOT_PASSWORD", TestConstants.MINIO_ROOT_PASSWORD)
                .withCommand("server /data")
                .waitingFor(new HttpWaitStrategy()
                        .forPath("/minio/health/live")
                        .forPort(9000))
                .withReuse(true);  // Reuse containers for faster local development
        minio.start();
    }

    /**
     * Configure non-standard Spring Boot properties dynamically from Testcontainers.
     * <p>
     * PostgreSQL configuration is now handled automatically by {@link ServiceConnection}.
     * Only MinIO and JWT configuration require manual {@link DynamicPropertySource}.
     */
    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        // MinIO configuration (manual - no @ServiceConnection support yet)
        registry.add("minio.url", () ->
                "http://" + minio.getHost() + ":" + minio.getMappedPort(9000));
        registry.add("minio.access-key", () -> TestConstants.MINIO_ROOT_USER);
        registry.add("minio.secret-key", () -> TestConstants.MINIO_ROOT_PASSWORD);
        registry.add("minio.bucket-name", () -> TestConstants.MINIO_BUCKET);

        // JWT configuration (test secret from TestConstants)
        registry.add("jwt.secret", () -> TestConstants.JWT_SECRET);
        registry.add("jwt.expiration", () -> String.valueOf(TestConstants.JWT_EXPIRATION_MS));
    }
}
