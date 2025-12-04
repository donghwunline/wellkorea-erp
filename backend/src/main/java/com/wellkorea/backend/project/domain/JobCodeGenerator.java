package com.wellkorea.backend.project.domain;

import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

/**
 * Domain service for generating unique JobCode identifiers.
 * Format: WK2K{YY}-{SSSS}-{MMDD}
 * Example: WK2K25-0001-0104
 * <p>
 * JobCode is the central identifier for customer requests, linking:
 * - Quotations
 * - Production tracking
 * - Delivery records
 * - Invoices
 * - Financial records
 * <p>
 * Thread-safe through JobCodeSequenceProvider implementation.
 */
@Service
public class JobCodeGenerator {

    private static final String JOB_CODE_PREFIX = "WK2K";
    private static final int YEAR_LENGTH = 2;
    private static final int SEQUENCE_LENGTH = 4;
    private static final int DATE_LENGTH = 4;
    private static final DateTimeFormatter YEAR_FORMATTER = DateTimeFormatter.ofPattern("yy");
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("MMdd");

    private final JobCodeSequenceProvider sequenceProvider;

    public JobCodeGenerator(JobCodeSequenceProvider sequenceProvider) {
        this.sequenceProvider = sequenceProvider;
    }

    /**
     * Generate next JobCode for the current date.
     * <p>
     * Format: WK2K{YY}-{SSSS}-{MMDD}
     * - YY: 2-digit year (e.g., "25" for 2025)
     * - SSSS: 4-digit zero-padded sequence number (e.g., "0001")
     * - MMDD: 4-digit date in MMdd format (e.g., "0104" for January 4th)
     *
     * @return Generated JobCode (e.g., "WK2K25-0001-0104")
     */
    public String generateJobCode() {
        LocalDate today = LocalDate.now();
        return generateJobCode(today);
    }

    /**
     * Generate next JobCode for a specific date.
     * Useful for backdating or testing purposes.
     * <p>
     * Format: WK2K{YY}-{SSSS}-{MMDD}
     *
     * @param date Date for the JobCode
     * @return Generated JobCode
     */
    public String generateJobCode(LocalDate date) {
        String year = date.format(YEAR_FORMATTER);
        String dateStr = date.format(DATE_FORMATTER);

        // Get next sequence number for this year from provider
        int sequence = sequenceProvider.getNextSequence(year);

        // Format: WK2K{YY}-{SSSS}-{MMDD}
        return String.format("%s%s-%0" + SEQUENCE_LENGTH + "d-%s", JOB_CODE_PREFIX, year, sequence, dateStr);
    }

    /**
     * Validate JobCode format.
     * <p>
     * Valid format: WK2K{YY}-{SSSS}-{MMDD}
     * - Prefix must be "WK2K"
     * - Year must be 2 digits
     * - Sequence must be 4 digits
     * - Date must be 4 digits in MMdd format
     *
     * @param jobCode JobCode to validate
     * @return true if valid, false otherwise
     */
    public boolean isValidJobCode(String jobCode) {
        if (jobCode == null || jobCode.isEmpty()) {
            return false;
        }

        // Pattern: WK2Kyy-ssss-MMdd
        // Example: WK2K25-0001-0104
        String pattern = String.format("^%s\\d{%d}-\\d{%d}-\\d{%d}$",
                JOB_CODE_PREFIX, YEAR_LENGTH, SEQUENCE_LENGTH, DATE_LENGTH);
        return jobCode.matches(pattern);
    }

    /**
     * Extract year from JobCode.
     *
     * @param jobCode JobCode string
     * @return Year as string (e.g., "25" for 2025)
     * @throws IllegalArgumentException if JobCode format is invalid
     */
    public String extractYear(String jobCode) {
        validateJobCode(jobCode);

        // Extract year (characters after prefix)
        int yearStart = JOB_CODE_PREFIX.length();
        int yearEnd = yearStart + YEAR_LENGTH;
        return jobCode.substring(yearStart, yearEnd);
    }

    /**
     * Extract sequence number from JobCode.
     *
     * @param jobCode JobCode string
     * @return Sequence number
     * @throws IllegalArgumentException if JobCode format is invalid
     */
    public int extractSequence(String jobCode) {
        validateJobCode(jobCode);

        // Extract sequence (after year and first dash)
        int sequenceStart = JOB_CODE_PREFIX.length() + YEAR_LENGTH + 1; // +1 for dash
        int sequenceEnd = sequenceStart + SEQUENCE_LENGTH;
        String sequenceStr = jobCode.substring(sequenceStart, sequenceEnd);
        return Integer.parseInt(sequenceStr);
    }

    /**
     * Extract date from JobCode.
     *
     * @param jobCode JobCode string
     * @return Date
     * @throws IllegalArgumentException if JobCode format is invalid
     */
    public LocalDate extractDate(String jobCode) {
        validateJobCode(jobCode);

        // Extract year (YY format)
        String year = extractYear(jobCode);

        // Extract date (MMDD format - after year, sequence, and two dashes)
        int dateStart = JOB_CODE_PREFIX.length() + YEAR_LENGTH + 1 + SEQUENCE_LENGTH + 1; // +2 for dashes
        String mmdd = jobCode.substring(dateStart);

        // Combine year and MMDD to create full date string
        String fullDateStr = "20" + year + mmdd; // Assuming 2000s century
        return LocalDate.parse(fullDateStr, DateTimeFormatter.ofPattern("yyyyMMdd"));
    }

    /**
     * Validate JobCode format and throw exception if invalid.
     *
     * @param jobCode JobCode to validate
     * @throws IllegalArgumentException if JobCode format is invalid
     */
    private void validateJobCode(String jobCode) {
        if (!isValidJobCode(jobCode)) {
            throw new IllegalArgumentException("Invalid JobCode format: " + jobCode);
        }
    }
}
