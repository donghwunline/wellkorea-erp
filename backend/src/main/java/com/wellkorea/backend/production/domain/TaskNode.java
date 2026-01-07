package com.wellkorea.backend.production.domain;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.Instant;

/**
 * A task node in the DAG task flow.
 * Represents a single task with title, assignee, deadline, and progress.
 * Position (x, y) is stored for React Flow visualization.
 */
@Entity
@Table(name = "task_nodes")
public class TaskNode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "flow_id", nullable = false)
    private TaskFlow flow;

    /**
     * Client-side node ID (UUID string) for React Flow.
     * Used to identify nodes in the frontend without exposing database IDs.
     */
    @Column(name = "node_id", nullable = false, length = 36)
    private String nodeId;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "assignee", length = 100)
    private String assignee;

    @Column(name = "deadline")
    private LocalDate deadline;

    /**
     * Progress percentage (0-100).
     */
    @Column(name = "progress", nullable = false)
    private Integer progress = 0;

    /**
     * X position for React Flow canvas.
     */
    @Column(name = "position_x", nullable = false)
    private Double positionX = 0.0;

    /**
     * Y position for React Flow canvas.
     */
    @Column(name = "position_y", nullable = false)
    private Double positionY = 0.0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    // ========== Business Methods ==========

    /**
     * Check if this task is overdue.
     * A task is overdue if deadline has passed and progress is not 100%.
     */
    public boolean isOverdue() {
        if (deadline == null) {
            return false;
        }
        return LocalDate.now().isAfter(deadline) && progress < 100;
    }

    /**
     * Get progress level for color coding.
     * @return "low" (0-33%), "medium" (34-66%), "high" (67-100%)
     */
    public String getProgressLevel() {
        if (progress <= 33) {
            return "low";
        } else if (progress <= 66) {
            return "medium";
        } else {
            return "high";
        }
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

    public String getNodeId() {
        return nodeId;
    }

    public void setNodeId(String nodeId) {
        this.nodeId = nodeId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getAssignee() {
        return assignee;
    }

    public void setAssignee(String assignee) {
        this.assignee = assignee;
    }

    public LocalDate getDeadline() {
        return deadline;
    }

    public void setDeadline(LocalDate deadline) {
        this.deadline = deadline;
    }

    public Integer getProgress() {
        return progress;
    }

    public void setProgress(Integer progress) {
        this.progress = Math.max(0, Math.min(100, progress));
    }

    public Double getPositionX() {
        return positionX;
    }

    public void setPositionX(Double positionX) {
        this.positionX = positionX;
    }

    public Double getPositionY() {
        return positionY;
    }

    public void setPositionY(Double positionY) {
        this.positionY = positionY;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
