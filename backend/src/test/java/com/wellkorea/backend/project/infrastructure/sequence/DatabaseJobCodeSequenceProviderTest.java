package com.wellkorea.backend.project.infrastructure.sequence;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.containers.wait.strategy.HttpWaitStrategy;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.*;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Testcontainers
class DatabaseJobCodeSequenceProviderTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("testdb")
            .withUsername("test")
            .withPassword("test");

    @Container
    static GenericContainer<?> minio = new GenericContainer<>("minio/minio:latest")
            .withExposedPorts(9000)
            .withEnv("MINIO_ROOT_USER", "minioadmin")
            .withEnv("MINIO_ROOT_PASSWORD", "minioadmin")
            .withCommand("server", "/data")
            .waitingFor(new HttpWaitStrategy()
                    .forPath("/minio/health/live")
                    .forPort(9000)
                    .withStartupTimeout(Duration.ofSeconds(60)));

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);

        registry.add("minio.url", () -> "http://" + minio.getHost() + ":" + minio.getMappedPort(9000));
        registry.add("minio.access-key", () -> "minioadmin");
        registry.add("minio.secret-key", () -> "minioadmin");
        registry.add("minio.bucket-name", () -> "test-bucket");
    }

    @Autowired
    private DatabaseJobCodeSequenceProvider sequenceProvider;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void setUp() {
        // Insert test data for foreign key constraints
        jdbcTemplate.update(
                "INSERT INTO users (id, username, email, password_hash, full_name) " +
                        "VALUES (1, 'testuser', 'test@example.com', 'hash', 'Test User') " +
                        "ON CONFLICT (id) DO NOTHING"
        );
        jdbcTemplate.update(
                "INSERT INTO customers (id, name, contact_person, phone, email) " +
                        "VALUES (1, 'Test Customer', 'John Doe', '123-456-7890', 'customer@example.com') " +
                        "ON CONFLICT (id) DO NOTHING"
        );
    }

    @Test
    void shouldGenerateSequenceNumber1ForNewYear() {
        // Given: No existing sequence for year 21
        String year = "21";

        // When: Generate sequence
        int sequence = sequenceProvider.getNextSequence(year);

        // Then: Should return 1
        assertThat(sequence).isEqualTo(1);
    }

    @Test
    void shouldIncrementSequenceForSameYear() {
        // Given: Sequence already exists for year 22 with last_sequence = 1
        String year = "22";
        jdbcTemplate.update(
                "INSERT INTO job_code_sequences (year, last_sequence, updated_at) VALUES (?, 1, CURRENT_TIMESTAMP)",
                year
        );

        // When: Generate next sequence
        int sequence = sequenceProvider.getNextSequence(year);

        // Then: Should return 2
        assertThat(sequence).isEqualTo(2);
    }

    @Test
    void shouldResetSequenceForNewYear() {
        // Given: Sequence exists for year 23 but not year 24
        jdbcTemplate.update(
                "INSERT INTO job_code_sequences (year, last_sequence, updated_at) VALUES ('23', 99, CURRENT_TIMESTAMP)"
        );

        // When: Generate sequence for year 24
        int sequence = sequenceProvider.getNextSequence("24");

        // Then: Should reset to 1 (new year, new sequence)
        assertThat(sequence).isEqualTo(1);
    }

    @Test
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    void shouldHandleConcurrentSequenceGeneration() throws Exception {
        // Given: Multiple threads trying to generate sequences simultaneously for year 25
        String year = "25";
        int threadCount = 10;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);

        try {
            // When: Generate sequences concurrently using invokeAll (guarantees all tasks complete)
            List<Callable<Integer>> tasks = IntStream.range(0, threadCount)
                    .<Callable<Integer>>mapToObj(i -> () -> sequenceProvider.getNextSequence(year))
                    .collect(Collectors.toList());

            List<Future<Integer>> futures = executor.invokeAll(tasks, 30, TimeUnit.SECONDS);

            // Collect all results
            List<Integer> generatedSequences = new ArrayList<>();
            for (Future<Integer> future : futures) {
                if (!future.isCancelled()) {
                    generatedSequences.add(future.get());
                }
            }

            // Then: All sequences should be unique and sequential
            assertThat(generatedSequences)
                    .as("Should have %d unique sequences", threadCount)
                    .hasSize(threadCount)
                    .containsExactlyInAnyOrder(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
        } finally {
            executor.shutdown();
            executor.awaitTermination(5, TimeUnit.SECONDS);
        }
    }

    @Test
    void shouldContinueSequenceAfterMultipleIncrements() {
        // Given: Sequence already at 5 for year 26
        String year = "26";
        jdbcTemplate.update(
                "INSERT INTO job_code_sequences (year, last_sequence, updated_at) VALUES (?, 5, CURRENT_TIMESTAMP)",
                year
        );

        // When: Generate next sequence
        int sequence = sequenceProvider.getNextSequence(year);

        // Then: Should return 6 (continues from last_sequence)
        assertThat(sequence).isEqualTo(6);
    }
}
