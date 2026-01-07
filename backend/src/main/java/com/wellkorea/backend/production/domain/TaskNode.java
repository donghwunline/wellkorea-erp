package com.wellkorea.backend.production.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.time.LocalDate;

/**
 * A task node in the DAG task flow (value object).
 * Represents a single task with title, assignee, deadline, and progress.
 * Position (x, y) is stored for React Flow visualization.
 */
@Embeddable
public class TaskNode {

    /**
     * Client-side node ID (UUID string) for React Flow.
     * Used to identify nodes in the frontend.
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

    // Default constructor for JPA
    public TaskNode() {
    }

    // Constructor for convenience
    public TaskNode(String nodeId, String title, String assignee, LocalDate deadline,
                    Integer progress, Double positionX, Double positionY) {
        this.nodeId = nodeId;
        this.title = title;
        this.assignee = assignee;
        this.deadline = deadline;
        this.progress = progress != null ? Math.max(0, Math.min(100, progress)) : 0;
        this.positionX = positionX != null ? positionX : 0.0;
        this.positionY = positionY != null ? positionY : 0.0;
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
}
