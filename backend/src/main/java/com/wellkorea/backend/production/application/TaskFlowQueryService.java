package com.wellkorea.backend.production.application;

import com.wellkorea.backend.production.api.dto.query.TaskEdgeView;
import com.wellkorea.backend.production.api.dto.query.TaskFlowView;
import com.wellkorea.backend.production.api.dto.query.TaskNodeView;
import com.wellkorea.backend.production.domain.TaskEdge;
import com.wellkorea.backend.production.domain.TaskFlow;
import com.wellkorea.backend.production.domain.TaskNode;
import com.wellkorea.backend.production.infrastructure.persistence.TaskFlowRepository;
import com.wellkorea.backend.project.infrastructure.repository.ProjectRepository;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Query service for task flows (CQRS pattern - read operations).
 * Returns task flow with nodes and edges for React Flow visualization.
 */
@Service
@Transactional(readOnly = true)
public class TaskFlowQueryService {

    private final TaskFlowRepository taskFlowRepository;
    private final ProjectRepository projectRepository;

    public TaskFlowQueryService(TaskFlowRepository taskFlowRepository,
                                 ProjectRepository projectRepository) {
        this.taskFlowRepository = taskFlowRepository;
        this.projectRepository = projectRepository;
    }

    /**
     * Get task flow by project ID.
     * Creates a new empty flow if one doesn't exist for the project.
     *
     * @param projectId Project ID
     * @return TaskFlowView with nodes and edges
     */
    public TaskFlowView getByProjectId(Long projectId) {
        // Verify project exists
        if (!projectRepository.existsById(projectId)) {
            throw new ResourceNotFoundException("Project", projectId);
        }

        return taskFlowRepository.findByProjectId(projectId)
                .map(this::toView)
                .orElseGet(() -> TaskFlowView.empty(projectId));
    }

    /**
     * Get task flow by ID.
     *
     * @param id Task flow ID
     * @return TaskFlowView with nodes and edges
     */
    public TaskFlowView getById(Long id) {
        return taskFlowRepository.findById(id)
                .map(this::toView)
                .orElseThrow(() -> new ResourceNotFoundException("TaskFlow", id));
    }

    /**
     * Convert entity to view DTO.
     * Element collections are accessed within transaction (lazy loading).
     */
    private TaskFlowView toView(TaskFlow flow) {
        List<TaskNodeView> nodeViews = flow.getNodes().stream()
                .map(this::toNodeView)
                .toList();

        List<TaskEdgeView> edgeViews = flow.getEdges().stream()
                .map(this::toEdgeView)
                .toList();

        return new TaskFlowView(
                flow.getId(),
                flow.getProject().getId(),
                nodeViews,
                edgeViews,
                flow.getCreatedAt(),
                flow.getUpdatedAt()
        );
    }

    private TaskNodeView toNodeView(TaskNode node) {
        return new TaskNodeView(
                node.getNodeId(),
                node.getTitle(),
                node.getAssignee(),
                node.getDeadline(),
                node.getProgress(),
                node.getPositionX(),
                node.getPositionY()
        );
    }

    private TaskEdgeView toEdgeView(TaskEdge edge) {
        return new TaskEdgeView(
                edge.getEdgeId(),
                edge.getSourceNodeId(),
                edge.getTargetNodeId()
        );
    }
}
