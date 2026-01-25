package com.wellkorea.backend.shared.storage.api.dto.query;

/**
 * View DTO for unified project documents.
 * Aggregates blueprints, delivery photos, and future invoice documents.
 * <p>
 * Used by DocumentQueryService for read operations (CQRS query side).
 */
public record ProjectDocumentView(
        Long id,
        String documentType,      // "BLUEPRINT" | "DELIVERY_PHOTO" | "INVOICE"
        String fileName,
        String fileType,          // JPG, PNG, PDF, DXF, DWG
        Long fileSize,
        String storagePath,       // Internal, for URL generation
        String uploadedByName,
        String uploadedAt,        // ISO datetime string
        String downloadUrl,       // Enriched by service
        Long sourceId,            // deliveryId, taskFlowId, or invoiceId
        String sourceLabel        // "Delivery 2024-01-15", "Node: Design", etc.
) {

    /**
     * Create a new instance with the download URL populated.
     * Used after MyBatis mapping to enrich with presigned URL.
     */
    public ProjectDocumentView withDownloadUrl(String url) {
        return new ProjectDocumentView(
                id, documentType, fileName, fileType, fileSize,
                storagePath, uploadedByName, uploadedAt, url, sourceId, sourceLabel
        );
    }

    /**
     * Format file size for human-readable display.
     */
    public String formattedFileSize() {
        if (fileSize == null || fileSize <= 0) return "0 B";
        if (fileSize < 1024) return fileSize + " B";
        if (fileSize < 1024 * 1024) return String.format("%.1f KB", fileSize / 1024.0);
        return String.format("%.1f MB", fileSize / (1024.0 * 1024));
    }
}
