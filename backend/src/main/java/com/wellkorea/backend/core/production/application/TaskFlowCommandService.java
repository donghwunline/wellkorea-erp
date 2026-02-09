package com.wellkorea.backend.core.production.application;

import com.wellkorea.backend.core.production.api.dto.command.SaveTaskFlowRequest;
import com.wellkorea.backend.core.production.domain.TaskEdge;
import com.wellkorea.backend.core.production.domain.TaskFlow;
import com.wellkorea.backend.core.production.domain.TaskNode;
import com.wellkorea.backend.core.production.infrastructure.persistence.TaskFlowRepository;
import com.wellkorea.backend.core.project.domain.Project;
import com.wellkorea.backend.core.project.infrastructure.repository.ProjectRepository;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

/**
 * Command service for task flows (CQRS pattern - write operations).
 * Handles saving task flow with nodes and edges.
 */
@Service
@Transactional
public class TaskFlowCommandService {

    private static final Logger log = LoggerFactory.getLogger(TaskFlowCommandService.class);

    private final TaskFlowRepository taskFlowRepository;
    private final ProjectRepository projectRepository;

    public TaskFlowCommandService(TaskFlowRepository taskFlowRepository,
                                  ProjectRepository projectRepository) {
        this.taskFlowRepository = taskFlowRepository;
        this.projectRepository = projectRepository;
    }

    /**
     * Save task flow (full replacement of nodes and edges).
     * Element collections are completely replaced, avoiding orphan removal issues.
     *
     * @param id      Task flow ID
     * @param request Save request with nodes and edges
     * @return The saved task flow ID
     */
    public Long saveTaskFlow(Long id, SaveTaskFlowRequest request) {
        log.info("Saving task flow id={}: nodes={}, edges={}", id,
                request.nodes() != null ? request.nodes().size() : 0,
                request.edges() != null ? request.edges().size() : 0);

        TaskFlow flow = taskFlowRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("TaskFlow", id));

        // Build new nodes set
        Set<TaskNode> newNodes = new HashSet<>();
        if (request.nodes() != null) {
            for (SaveTaskFlowRequest.NodeData nodeData : request.nodes()) {
                TaskNode node = new TaskNode(
                        nodeData.id(),
                        nodeData.title(),
                        nodeData.assignee(),
                        nodeData.deadline(),
                        nodeData.progress(),
                        nodeData.positionX(),
                        nodeData.positionY()
                );
                newNodes.add(node);
            }
        }

        // Build new edges set
        Set<TaskEdge> newEdges = new HashSet<>();
        if (request.edges() != null) {
            for (SaveTaskFlowRequest.EdgeData edgeData : request.edges()) {
                TaskEdge edge = new TaskEdge(
                        edgeData.id(),
                        edgeData.source(),
                        edgeData.target()
                );
                newEdges.add(edge);
            }
        }

        // Replace collections (element collections are replaced wholesale)
        flow.replaceNodes(newNodes);
        flow.replaceEdges(newEdges);

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
        log.info("Creating task flow for project id={}", projectId);

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
        log.info("Created task flow: id={}, projectId={}", flow.getId(), projectId);
        return flow.getId();
    }
}
