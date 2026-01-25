package com.wellkorea.backend.shared.storage.application;

import com.wellkorea.backend.shared.storage.api.dto.query.ProjectDocumentView;
import com.wellkorea.backend.shared.storage.infrastructure.MinioFileStorage;
import com.wellkorea.backend.shared.storage.infrastructure.mapper.DocumentMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * Query service for unified project documents (CQRS read side).
 * <p>
 * Aggregates documents from multiple sources:
 * - Blueprint attachments (TaskFlow nodes)
 * - Delivery photos (from DELIVERED deliveries)
 * - Invoice documents (future)
 * <p>
 * Separated from AttachmentService to follow CQRS pattern:
 * - AttachmentService: Command operations (create, update, delete)
 * - DocumentQueryService: Query operations (read, list)
 */
@Service
@Transactional(readOnly = true)
public class DocumentQueryService {

    private static final Logger log = LoggerFactory.getLogger(DocumentQueryService.class);
    private static final int DOWNLOAD_URL_EXPIRY_MINUTES = 15;

    private final DocumentMapper documentMapper;
    private final MinioFileStorage fileStorage;

    public DocumentQueryService(DocumentMapper documentMapper, MinioFileStorage fileStorage) {
        this.documentMapper = documentMapper;
        this.fileStorage = fileStorage;
    }

    /**
     * Get all documents for a project.
     * <p>
     * Aggregates blueprints and delivery photos into a unified list.
     * Each document is enriched with a presigned download URL.
     *
     * @param projectId The project ID
     * @return List of documents ordered by upload date descending
     */
    public List<ProjectDocumentView> getDocumentsByProject(Long projectId) {
        log.debug("Fetching documents for project {}", projectId);

        List<ProjectDocumentView> documents = documentMapper.findDocumentsByProjectId(projectId);

        // Enrich each document with presigned download URL
        List<ProjectDocumentView> enrichedDocuments = documents.stream()
                .map(this::enrichWithDownloadUrl)
                .toList();

        log.debug("Found {} documents for project {}", enrichedDocuments.size(), projectId);

        return enrichedDocuments;
    }

    /**
     * Generate a presigned download URL for a document.
     */
    private ProjectDocumentView enrichWithDownloadUrl(ProjectDocumentView doc) {
        String downloadUrl = fileStorage.generatePresignedUrl(
                doc.storagePath(),
                DOWNLOAD_URL_EXPIRY_MINUTES,
                TimeUnit.MINUTES
        );
        return doc.withDownloadUrl(downloadUrl);
    }
}
