package com.wellkorea.backend.shared.storage.api;

import com.wellkorea.backend.shared.dto.ApiResponse;
import com.wellkorea.backend.shared.storage.api.dto.query.ProjectDocumentView;
import com.wellkorea.backend.shared.storage.application.DocumentQueryService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST controller for unified document queries.
 * <p>
 * Provides read-only access to project documents aggregated from multiple sources:
 * - Blueprint attachments (TaskFlow nodes)
 * - Delivery photos
 * - Invoice documents (future)
 * <p>
 * This follows CQRS pattern - query-only operations.
 * For document uploads/management, see domain-specific controllers.
 */
@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    private final DocumentQueryService queryService;

    public DocumentController(DocumentQueryService queryService) {
        this.queryService = queryService;
    }

    // ==================== QUERY ENDPOINTS ====================

    /**
     * Get all documents for a project.
     * <p>
     * Aggregates blueprints, delivery photos, and invoice documents
     * into a unified list sorted by upload date (newest first).
     * <p>
     * GET /api/documents?projectId={id}
     *
     * @param projectId The project ID to query documents for
     * @return List of project documents with download URLs
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PRODUCTION', 'SALES', 'FINANCE')")
    public ResponseEntity<ApiResponse<List<ProjectDocumentView>>> getDocuments(
            @RequestParam Long projectId) {
        List<ProjectDocumentView> documents = queryService.getDocumentsByProject(projectId);
        return ResponseEntity.ok(ApiResponse.success(documents));
    }
}
