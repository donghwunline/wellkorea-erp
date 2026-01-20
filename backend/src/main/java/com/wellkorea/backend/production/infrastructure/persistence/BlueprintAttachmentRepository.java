package com.wellkorea.backend.production.infrastructure.persistence;

import com.wellkorea.backend.production.domain.BlueprintAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for BlueprintAttachment entity.
 * Provides CRUD operations and custom queries for blueprint attachments.
 */
@Repository
public interface BlueprintAttachmentRepository extends JpaRepository<BlueprintAttachment, Long> {

    /**
     * Find all attachments for a specific node in a TaskFlow.
     *
     * @param flowId TaskFlow ID
     * @param nodeId Node ID within the TaskFlow
     * @return List of attachments for the node
     */
    List<BlueprintAttachment> findByTaskFlowIdAndNodeId(Long flowId, String nodeId);

    /**
     * Find all attachments for a TaskFlow.
     *
     * @param flowId TaskFlow ID
     * @return List of all attachments in the flow
     */
    List<BlueprintAttachment> findByTaskFlowId(Long flowId);

    /**
     * Check if an attachment with the same name already exists for a node.
     *
     * @param flowId   TaskFlow ID
     * @param nodeId   Node ID
     * @param fileName File name to check
     * @return true if duplicate exists
     */
    boolean existsByTaskFlowIdAndNodeIdAndFileName(Long flowId, String nodeId, String fileName);

    /**
     * Count attachments for a specific node.
     *
     * @param flowId TaskFlow ID
     * @param nodeId Node ID
     * @return Number of attachments
     */
    long countByTaskFlowIdAndNodeId(Long flowId, String nodeId);

    /**
     * Delete all attachments for a specific node.
     *
     * @param flowId TaskFlow ID
     * @param nodeId Node ID
     */
    void deleteByTaskFlowIdAndNodeId(Long flowId, String nodeId);

    /**
     * Find attachments by project ID (via TaskFlow relationship).
     *
     * @param projectId Project ID
     * @return List of attachments for the project
     */
    @Query("SELECT ba FROM BlueprintAttachment ba WHERE ba.taskFlow.project.id = :projectId")
    List<BlueprintAttachment> findByProjectId(@Param("projectId") Long projectId);
}
