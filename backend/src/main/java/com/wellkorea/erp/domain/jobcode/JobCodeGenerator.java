package com.wellkorea.erp.domain.jobcode;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

/**
 * Service for generating unique JobCode sequences
 * Format: WK2{year}-{sequence}-{date}
 * Example: WK2K25-0600-1017
 */
@Service
public class JobCodeGenerator {

    @PersistenceContext
    private EntityManager entityManager;

    private static final DateTimeFormatter YEAR_FORMATTER = DateTimeFormatter.ofPattern("yy");
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("MMdd");

    /**
     * Generate next JobCode with format WK2{year}-{sequence}-{date}
     */
    @Transactional
    public String generateJobCode() {
        LocalDate now = LocalDate.now();
        int year = now.getYear();

        // Get or create sequence for this year
        int sequence = getNextSequence(year);

        // Format components
        String yearPart = "K" + now.format(YEAR_FORMATTER); // K25 for 2025
        String sequencePart = String.format("%04d", sequence); // 0600
        String datePart = now.format(DATE_FORMATTER); // 1017 for Oct 17

        return String.format("WK2%s-%s-%s", yearPart, sequencePart, datePart);
    }

    /**
     * Get next sequence number for the year (thread-safe with database lock)
     */
    private int getNextSequence(int year) {
        // Use native SQL with SELECT FOR UPDATE to prevent race conditions
        Query selectQuery = entityManager.createNativeQuery(
                "SELECT last_sequence FROM jobcode_sequences WHERE year = :year FOR UPDATE");
        selectQuery.setParameter("year", year);

        Integer lastSequence;
        try {
            lastSequence = (Integer) selectQuery.getSingleResult();
        } catch (Exception e) {
            // Year doesn't exist, insert it
            lastSequence = null;
        }

        int nextSequence;
        if (lastSequence == null) {
            // Insert new year with sequence 1
            nextSequence = 1;
            Query insertQuery = entityManager.createNativeQuery(
                    "INSERT INTO jobcode_sequences (year, last_sequence) VALUES (:year, :seq)");
            insertQuery.setParameter("year", year);
            insertQuery.setParameter("seq", nextSequence);
            insertQuery.executeUpdate();
        } else {
            // Increment existing sequence
            nextSequence = lastSequence + 1;
            Query updateQuery = entityManager.createNativeQuery(
                    "UPDATE jobcode_sequences SET last_sequence = :seq WHERE year = :year");
            updateQuery.setParameter("seq", nextSequence);
            updateQuery.setParameter("year", year);
            updateQuery.executeUpdate();
        }

        return nextSequence;
    }

    /**
     * Validate JobCode format
     */
    public boolean isValidJobCodeFormat(String jobcode) {
        if (jobcode == null || jobcode.isEmpty()) {
            return false;
        }
        // Format: WK2K25-0600-1017
        return jobcode.matches("WK2K\\d{2}-\\d{4}-\\d{4}");
    }
}
