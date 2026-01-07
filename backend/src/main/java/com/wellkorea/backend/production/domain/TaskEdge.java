package com.wellkorea.backend.production.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

/**
 * An edge (connection) between two task nodes in the DAG (value object).
 * Represents a dependency: source node must complete before target node can start.
 */
@Embeddable
public class TaskEdge {

    /**
     * Client-side edge ID (UUID string) for React Flow.
     */
    @Column(name = "edge_id", nullable = false, length = 36)
    private String edgeId;

    /**
     * Source node ID (the nodeId field of TaskNode, not the database ID).
     */
    @Column(name = "source_node_id", nullable = false, length = 36)
    private String sourceNodeId;

    /**
     * Target node ID (the nodeId field of TaskNode, not the database ID).
     */
    @Column(name = "target_node_id", nullable = false, length = 36)
    private String targetNodeId;

    // Default constructor for JPA
    public TaskEdge() {
    }

    // Constructor for convenience
    public TaskEdge(String edgeId, String sourceNodeId, String targetNodeId) {
        this.edgeId = edgeId;
        this.sourceNodeId = sourceNodeId;
        this.targetNodeId = targetNodeId;
    }

    // ========== Getters and Setters ==========

    public String getEdgeId() {
        return edgeId;
    }

    public void setEdgeId(String edgeId) {
        this.edgeId = edgeId;
    }

    public String getSourceNodeId() {
        return sourceNodeId;
    }

    public void setSourceNodeId(String sourceNodeId) {
        this.sourceNodeId = sourceNodeId;
    }

    public String getTargetNodeId() {
        return targetNodeId;
    }

    public void setTargetNodeId(String targetNodeId) {
        this.targetNodeId = targetNodeId;
    }
}
