package com.wellkorea.backend.shared.test;

import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.containers.wait.strategy.HttpWaitStrategy;

/**
 * Factory for creating and configuring Testcontainers.
 * Centralizes container setup logic for consistency and reusability.
 * <p>
 * Usage:
 * <pre>
 * {@code
 * PostgreSQLContainer<?> postgres = TestContainersFactory.createPostgresContainer();
 * postgres.start();
 * }
 * </pre>
 */
public final class TestContainersFactory {

    private TestContainersFactory() {
        // Utility class - prevent instantiation
        throw new UnsupportedOperationException("This is a utility class and cannot be instantiated");
    }

    /**
     * Creates a configured PostgreSQL container for integration tests.
     * Uses Spring Boot {@code @ServiceConnection} for automatic configuration.
     *
     * @return PostgreSQL 16 container ready to start
     */
    public static PostgreSQLContainer<?> createPostgresContainer() {
        return new PostgreSQLContainer<>(TestConstants.POSTGRES_VERSION)
                .withDatabaseName(TestConstants.TEST_DB_NAME)
                .withUsername(TestConstants.TEST_DB_USERNAME)
                .withPassword(TestConstants.TEST_DB_PASSWORD)
                .withReuse(true);  // Reuse containers for faster local development
    }

    /**
     * Creates a configured MinIO container for integration tests.
     * Requires manual Spring property configuration via {@code @DynamicPropertySource}.
     *
     * @return MinIO container ready to start
     */
    public static GenericContainer<?> createMinioContainer() {
        return new GenericContainer<>(TestConstants.MINIO_VERSION)
                .withExposedPorts(9000)
                .withEnv("MINIO_ROOT_USER", TestConstants.MINIO_ROOT_USER)
                .withEnv("MINIO_ROOT_PASSWORD", TestConstants.MINIO_ROOT_PASSWORD)
                .withCommand("server /data")
                .waitingFor(new HttpWaitStrategy()
                        .forPath("/minio/health/live")
                        .forPort(9000))
                .withReuse(true);  // Reuse containers for faster local development
    }
}
