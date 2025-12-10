package com.wellkorea.backend;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.containers.wait.strategy.HttpWaitStrategy;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Base class for integration tests with Testcontainers.
 * Provides shared PostgreSQL and MinIO containers for all integration tests.
 * <p>
 * Usage: Extend this class in your integration tests instead of duplicating container configuration.
 * <p>
 * Example:
 * <pre>
 * {@code
 * @AutoConfigureMockMvc
 * class MyIntegrationTest extends BaseIntegrationTest {
 *     // Test methods
 * }
 * }
 * </pre>
 */
@SpringBootTest
@ActiveProfiles("test")
@Testcontainers
public abstract class BaseIntegrationTest {

    /**
     * PostgreSQL 16 container for database integration tests.
     * Shared across all tests in the same JVM (static container).
     */
    @Container
    protected static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("wellkorea_test")
            .withUsername("test")
            .withPassword("test");

    /**
     * MinIO container for S3-compatible storage integration tests.
     * Shared across all tests in the same JVM (static container).
     */
    @Container
    protected static final GenericContainer<?> minio = new GenericContainer<>("minio/minio:latest")
            .withExposedPorts(9000)
            .withEnv("MINIO_ROOT_USER", "minioadmin")
            .withEnv("MINIO_ROOT_PASSWORD", "minioadmin")
            .withCommand("server /data")
            .waitingFor(new HttpWaitStrategy()
                    .forPath("/minio/health/live")
                    .forPort(9000));

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
