package com.wellkorea.backend.production.domain;

import jakarta.persistence.*;

import java.time.Instant;

/**
 * An edge (connection) between two task nodes in the DAG.
 * Represents a dependency: source node must complete before target node can start.
 */
@Entity
@Table(name = "task_edges",
        uniqueConstraints = @UniqueConstraint(columnNames = {"flow_id", "source_node_id", "target_node_id"}))
public class TaskEdge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "flow_id", nullable = false)
    private TaskFlow flow;

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

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
    }

    // ========== Getters and Setters ==========

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public TaskFlow getFlow() {
        return flow;
    }

    public void setFlow(TaskFlow flow) {
        this.flow = flow;
    }

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

    public Instant getCreatedAt() {
        return createdAt;
    }
}
