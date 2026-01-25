package com.wellkorea.backend.shared.storage.infrastructure.mapper;

import com.wellkorea.backend.shared.storage.api.dto.query.ProjectDocumentView;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * MyBatis mapper for unified document queries.
 * <p>
 * Aggregates documents from multiple sources (blueprints, delivery photos, invoices)
 * into a unified view for the DocumentPanel widget.
 */
@Mapper
public interface DocumentMapper {

    /**
     * Find all documents associated with a project.
     * <p>
     * Returns a unified list including:
     * - Blueprint attachments (from TaskFlow nodes)
     * - Delivery photos (from DELIVERED deliveries)
     * - Invoice documents (future, not yet implemented)
     * <p>
     * Results are ordered by upload date descending (newest first).
     *
     * @param projectId The project ID to query documents for
     * @return List of project documents with source context
     */
    List<ProjectDocumentView> findDocumentsByProjectId(@Param("projectId") Long projectId);

    /**
     * Count all documents associated with a project.
     * <p>
     * Counts documents from all sources (blueprints + delivery photos).
     *
     * @param projectId The project ID to count documents for
     * @return Total number of documents
     */
    long countDocumentsByProjectId(@Param("projectId") Long projectId);
}
