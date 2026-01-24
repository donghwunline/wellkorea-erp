package com.wellkorea.backend.shared.storage.infrastructure;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

/**
 * Utility for generating structured file paths in MinIO.
 * Organizes files by document type and date for easy management.
 * <p>
 * Path structure: {type}/{year}/{month}/{filename}
 * Example: quotations/2025/01/Q-2025-000123-20250104.pdf
 */
public class FilePathGenerator {

    private static final DateTimeFormatter YEAR_FORMATTER = DateTimeFormatter.ofPattern("yyyy");
    private static final DateTimeFormatter MONTH_FORMATTER = DateTimeFormatter.ofPattern("MM");

    /**
     * Generate a file path for quotation PDFs.
     *
     * @param quotationCode Quotation code (e.g., "Q-2025-000123")
     * @param date          Quotation date
     * @return File path (e.g., "quotations/2025/01/Q-2025-000123-20250104.pdf")
     */
    public static String forQuotation(String quotationCode, LocalDate date) {
        return String.format("quotations/%s/%s/%s-%s.pdf",
                date.format(YEAR_FORMATTER),
                date.format(MONTH_FORMATTER),
                quotationCode,
                date.format(DateTimeFormatter.BASIC_ISO_DATE)
        );
    }

    /**
     * Generate a file path for tax invoice PDFs.
     *
     * @param invoiceNumber Tax invoice number (e.g., "INV-2025-000456")
     * @param date          Invoice date
     * @return File path (e.g., "tax-invoices/2025/01/INV-2025-000456-20250104.pdf")
     */
    public static String forTaxInvoice(String invoiceNumber, LocalDate date) {
        return String.format("tax-invoices/%s/%s/%s-%s.pdf",
                date.format(YEAR_FORMATTER),
                date.format(MONTH_FORMATTER),
                invoiceNumber,
                date.format(DateTimeFormatter.BASIC_ISO_DATE)
        );
    }

    /**
     * Generate a file path for delivery documents.
     *
     * @param deliveryNumber Delivery number
     * @param date           Delivery date
     * @return File path (e.g., "deliveries/2025/01/DEL-2025-000789-20250104.pdf")
     */
    public static String forDelivery(String deliveryNumber, LocalDate date) {
        return String.format("deliveries/%s/%s/%s-%s.pdf",
                date.format(YEAR_FORMATTER),
                date.format(MONTH_FORMATTER),
                deliveryNumber,
                date.format(DateTimeFormatter.BASIC_ISO_DATE)
        );
    }

    /**
     * Generate a file path for Excel exports.
     *
     * @param reportType Report type (e.g., "financial-report", "project-summary")
     * @param date       Export date
     * @return File path (e.g., "exports/2025/01/financial-report-20250104-abc123.xlsx")
     */
    public static String forExcelExport(String reportType, LocalDate date) {
        String uuid = UUID.randomUUID().toString().substring(0, 8);
        return String.format("exports/%s/%s/%s-%s-%s.xlsx",
                date.format(YEAR_FORMATTER),
                date.format(MONTH_FORMATTER),
                reportType,
                date.format(DateTimeFormatter.BASIC_ISO_DATE),
                uuid
        );
    }

    /**
     * Generate a file path for user attachments.
     *
     * @param entityType Entity type (e.g., "project", "quotation")
     * @param entityId   Entity ID
     * @param filename   Original filename (will be sanitized)
     * @return File path (e.g., "attachments/project/12345/original-filename-abc123.pdf")
     */
    public static String forAttachment(String entityType, Long entityId, String filename) {
        String sanitized = sanitizeFilename(filename);
        String uuid = UUID.randomUUID().toString().substring(0, 8);
        String extension = getFileExtension(filename);

        String baseFilename = sanitized.substring(0, Math.min(sanitized.length() - extension.length() - 1, 50));
        return String.format("attachments/%s/%d/%s-%s.%s",
                entityType.toLowerCase(),
                entityId,
                baseFilename,
                uuid,
                extension
        );
    }

    /**
     * Generate a file path for temporary files.
     * Temporary files should be cleaned up after processing.
     *
     * @param prefix Filename prefix
     * @return File path (e.g., "temp/2025/01/prefix-abc123-20250104.tmp")
     */
    public static String forTempFile(String prefix) {
        LocalDate now = LocalDate.now();
        String uuid = UUID.randomUUID().toString().substring(0, 8);
        return String.format("temp/%s/%s/%s-%s-%s.tmp",
                now.format(YEAR_FORMATTER),
                now.format(MONTH_FORMATTER),
                prefix,
                uuid,
                now.format(DateTimeFormatter.BASIC_ISO_DATE)
        );
    }

    /**
     * Sanitize filename to remove unsafe characters.
     *
     * @param filename Original filename
     * @return Sanitized filename (only alphanumeric, dash, underscore, dot)
     */
    private static String sanitizeFilename(String filename) {
        return filename.replaceAll("[^a-zA-Z0-9._-]", "_");
    }

    /**
     * Extract file extension from filename.
     *
     * @param filename Filename
     * @return File extension (without dot) or "bin" if no extension
     */
    private static String getFileExtension(String filename) {
        int lastDot = filename.lastIndexOf('.');
        if (lastDot > 0 && lastDot < filename.length() - 1) {
            return filename.substring(lastDot + 1).toLowerCase();
        }
        return "bin";
    }
}
