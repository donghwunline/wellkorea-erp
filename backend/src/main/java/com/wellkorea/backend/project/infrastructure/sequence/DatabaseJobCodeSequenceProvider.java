package com.wellkorea.backend.project.infrastructure.sequence;

import com.wellkorea.backend.project.domain.JobCodeSequenceProvider;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Database-backed implementation of JobCodeSequenceProvider.
 * Uses dedicated sequences table with row-level locking for thread-safe sequence generation.
 * <p>
 * Thread-safe: Uses SELECT FOR UPDATE to lock the sequence row during transaction.
 * Row-level locks are automatically released on transaction commit/rollback, ensuring
 * graceful handling of application crashes.
 * <p>
 * Exception handling: Let Spring's DataAccessException bubble up naturally.
 * Database failures are infrastructure concerns, not business rule violations.
 * GlobalExceptionHandler will catch and handle DataAccessException appropriately.
 */
@Component
public class DatabaseJobCodeSequenceProvider implements JobCodeSequenceProvider {

    private final JdbcTemplate jdbcTemplate;

    public DatabaseJobCodeSequenceProvider(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    @Transactional
    public int getNextSequence(String year) {
        // Use PostgreSQL UPSERT with RETURNING clause for atomic increment
        // This handles both insert (first time) and update (subsequent calls) in one query
        String sql = """
                INSERT INTO job_code_sequences (year, last_sequence, updated_at)
                VALUES (?, 1, CURRENT_TIMESTAMP)
                ON CONFLICT (year) DO UPDATE
                SET last_sequence = job_code_sequences.last_sequence + 1,
                    updated_at = CURRENT_TIMESTAMP
                RETURNING last_sequence
                """;

        Integer nextSequence = jdbcTemplate.queryForObject(sql, Integer.class, year);
        return nextSequence != null ? nextSequence : 1;
    }
}
