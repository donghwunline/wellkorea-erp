package com.wellkorea.backend;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.containers.wait.strategy.HttpWaitStrategy;

/**
 * Base class for integration tests with Testcontainers.
 * Provides singleton PostgreSQL and MinIO containers for all integration tests.
 * <p>
 * Containers are started once per JVM in a static initializer block and reused
 * across all test classes, ensuring stable port mappings and reliable test execution.
 * <p>
 * This pattern solves issues where tests pass individually but fail when run together
 * by guaranteeing containers are fully started before Spring context initialization.
 * <p>
 * Usage: Extend this class in your integration tests instead of duplicating container configuration.
 * <p>
 * Example:
 * <pre>
 * {@code
 * @AutoConfigureMockMvc  // Add this annotation if you need MockMvc
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
     */
    private static final PostgreSQLContainer<?> postgres;

    /**
     * MinIO container for S3-compatible storage integration tests.
     * Singleton container started once per JVM, reused across all tests.
     * Pinned to specific release for deterministic builds.
     */
    private static final GenericContainer<?> minio;

    /*
     * Static initializer block - containers start before any test class loads.
     * This ensures containers are fully running before Spring context initialization,
     * preventing race conditions and port mapping issues.
     */
    static {
        // Initialize and start PostgreSQL container
        postgres = new PostgreSQLContainer<>("postgres:16-alpine")
                .withDatabaseName("wellkorea_test")
                .withUsername("test")
                .withPassword("test")
                .withReuse(true);  // Reuse containers for faster local development
        postgres.start();

        // Initialize and start MinIO container
        minio = new GenericContainer<>("minio/minio:RELEASE.2024-12-13T22-19-12Z")
                .withExposedPorts(9000)
                .withEnv("MINIO_ROOT_USER", "minioadmin")
                .withEnv("MINIO_ROOT_PASSWORD", "minioadmin")
                .withCommand("server /data")
                .waitingFor(new HttpWaitStrategy()
                        .forPath("/minio/health/live")
                        .forPort(9000))
                .withReuse(true);  // Reuse containers for faster local development
        minio.start();
    }

    /**
     * Configure Spring Boot properties dynamically from Testcontainers.
     * Sets database URL, credentials, MinIO configuration, and test JWT secret.
     */
    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        // PostgreSQL configuration
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);

        // MinIO configuration
        registry.add("minio.url", () ->
                "http://" + minio.getHost() + ":" + minio.getMappedPort(9000));
        registry.add("minio.access-key", () -> "minioadmin");
        registry.add("minio.secret-key", () -> "minioadmin");
        registry.add("minio.bucket-name", () -> "wellkorea-test");

        // JWT configuration (test secret - 256 bits minimum)
        registry.add("jwt.secret", () ->
                "test-secret-key-for-integration-tests-minimum-256-bits-required-for-hs256");
        registry.add("jwt.expiration", () -> "3600000");  // 1 hour
    }
}
