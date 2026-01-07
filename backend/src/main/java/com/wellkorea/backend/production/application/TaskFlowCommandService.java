package com.wellkorea.backend.production.application;

import com.wellkorea.backend.production.api.dto.command.SaveTaskFlowRequest;
import com.wellkorea.backend.production.domain.TaskEdge;
import com.wellkorea.backend.production.domain.TaskFlow;
import com.wellkorea.backend.production.domain.TaskNode;
import com.wellkorea.backend.production.infrastructure.persistence.TaskFlowRepository;
import com.wellkorea.backend.project.domain.Project;
import com.wellkorea.backend.project.infrastructure.repository.ProjectRepository;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Command service for task flows (CQRS pattern - write operations).
 * Handles saving task flow with nodes and edges.
 */
@Service
@Transactional
public class TaskFlowCommandService {

    private final TaskFlowRepository taskFlowRepository;
    private final ProjectRepository projectRepository;

    public TaskFlowCommandService(TaskFlowRepository taskFlowRepository,
                                   ProjectRepository projectRepository) {
        this.taskFlowRepository = taskFlowRepository;
        this.projectRepository = projectRepository;
    }

    /**
     * Save task flow (create or update).
     * Performs full replacement of nodes and edges.
     *
     * @param id      Task flow ID
     * @param request Save request with nodes and edges
     * @return The saved task flow ID
     */
    public Long saveTaskFlow(Long id, SaveTaskFlowRequest request) {
        TaskFlow flow = taskFlowRepository.findByIdWithNodesAndEdges(id)
                .orElseThrow(() -> new ResourceNotFoundException("TaskFlow", id));

        // Clear existing nodes and edges (cascade will remove them)
        flow.clearAll();

        // Add new nodes
        if (request.nodes() != null) {
            for (SaveTaskFlowRequest.NodeData nodeData : request.nodes()) {
                TaskNode node = new TaskNode();
                node.setNodeId(nodeData.id());
                node.setTitle(nodeData.title());
                node.setAssignee(nodeData.assignee());
                node.setDeadline(nodeData.deadline());
                node.setProgress(nodeData.progress() != null ? nodeData.progress() : 0);
                node.setPositionX(nodeData.positionX() != null ? nodeData.positionX() : 0.0);
                node.setPositionY(nodeData.positionY() != null ? nodeData.positionY() : 0.0);
                flow.addNode(node);
            }
        }

        // Add new edges
        if (request.edges() != null) {
            for (SaveTaskFlowRequest.EdgeData edgeData : request.edges()) {
                TaskEdge edge = new TaskEdge();
                edge.setEdgeId(edgeData.id());
                edge.setSourceNodeId(edgeData.source());
                edge.setTargetNodeId(edgeData.target());
                flow.addEdge(edge);
            }
        }

        taskFlowRepository.save(flow);
        return flow.getId();
    }

    /**
     * Create a new task flow for a project.
     * Called when getByProjectId finds no existing flow.
     *
     * @param projectId Project ID
     * @return The created task flow ID
     */
    public Long createTaskFlow(Long projectId) {
        // Check if flow already exists
        if (taskFlowRepository.existsByProjectId(projectId)) {
            return taskFlowRepository.findByProjectId(projectId)
                    .orElseThrow()
                    .getId();
        }

        // Get project
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));

        // Create new flow
        TaskFlow flow = new TaskFlow();
        flow.setProject(project);

        taskFlowRepository.save(flow);
        return flow.getId();
    }
}
