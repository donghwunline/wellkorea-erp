package com.wellkorea.backend.project.domain;

/**
 * Domain interface for generating unique sequence numbers for JobCodes.
 * Implementation is infrastructure-specific (e.g., database, Redis, etc.).
 * <p>
 * Sequence numbers reset to 1 at the start of each year.
 * Must be thread-safe to handle concurrent requests.
 */
public interface JobCodeSequenceProvider {

    /**
     * Get the next sequence number for a given year.
     * Must be thread-safe and guarantee uniqueness across concurrent requests.
     * <p>
     * Sequence resets to 1 at the start of each year.
     *
     * @param year Year as string (e.g., "2025")
     * @return Next sequence number (1-based)
     */
    int getNextSequence(String year);
}
