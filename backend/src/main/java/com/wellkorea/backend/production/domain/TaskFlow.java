package com.wellkorea.backend.production.domain;

import com.wellkorea.backend.project.domain.Project;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

/**
 * Task flow representing a DAG (Directed Acyclic Graph) of tasks for a project.
 * Each project has exactly one task flow.
 * Contains nodes (tasks) and edges (dependencies between tasks).
 */
@Entity
@Table(name = "task_flows",
        uniqueConstraints = @UniqueConstraint(columnNames = {"project_id"}))
public class TaskFlow {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false, unique = true)
    private Project project;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @OneToMany(mappedBy = "flow", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private Set<TaskNode> nodes = new HashSet<>();

    @OneToMany(mappedBy = "flow", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private Set<TaskEdge> edges = new HashSet<>();

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
     * Add a node to this flow.
     */
    public void addNode(TaskNode node) {
        nodes.add(node);
        node.setFlow(this);
    }

    /**
     * Remove a node from this flow.
     * Also removes all edges connected to this node.
     */
    public void removeNode(TaskNode node) {
        nodes.remove(node);
        edges.removeIf(edge ->
                edge.getSourceNodeId().equals(node.getNodeId()) ||
                edge.getTargetNodeId().equals(node.getNodeId())
        );
    }

    /**
     * Add an edge to this flow.
     */
    public void addEdge(TaskEdge edge) {
        edges.add(edge);
        edge.setFlow(this);
    }

    /**
     * Remove an edge from this flow.
     */
    public void removeEdge(TaskEdge edge) {
        edges.remove(edge);
    }

    /**
     * Clear all nodes and edges.
     */
    public void clearAll() {
        nodes.clear();
        edges.clear();
    }

    // ========== Getters and Setters ==========

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Project getProject() {
        return project;
    }

    public void setProject(Project project) {
        this.project = project;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public Set<TaskNode> getNodes() {
        return nodes;
    }

    public void setNodes(Set<TaskNode> nodes) {
        this.nodes = nodes;
    }

    public Set<TaskEdge> getEdges() {
        return edges;
    }

    public void setEdges(Set<TaskEdge> edges) {
        this.edges = edges;
    }
}
