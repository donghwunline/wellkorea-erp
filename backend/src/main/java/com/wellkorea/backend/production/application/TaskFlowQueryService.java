package com.wellkorea.backend.production.application;

import com.wellkorea.backend.production.api.dto.query.TaskFlowView;
import com.wellkorea.backend.production.infrastructure.mapper.TaskFlowMapper;
import com.wellkorea.backend.project.infrastructure.repository.ProjectRepository;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Query service for task flows (CQRS pattern - read operations).
 * Returns task flow with nodes and edges for React Flow visualization.
 *
 * <p>Uses MyBatis for all queries to avoid N+1 issues and optimize read performance.
 */
@Service
@Transactional(readOnly = true)
public class TaskFlowQueryService {

    private final TaskFlowMapper taskFlowMapper;
    private final ProjectRepository projectRepository;

    public TaskFlowQueryService(TaskFlowMapper taskFlowMapper,
                                ProjectRepository projectRepository) {
        this.taskFlowMapper = taskFlowMapper;
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

        return taskFlowMapper.findByProjectId(projectId)
                .orElseGet(() -> TaskFlowView.empty(projectId));
    }

    /**
     * Get task flow by ID.
     *
     * @param id Task flow ID
     * @return TaskFlowView with nodes and edges
     */
    public TaskFlowView getById(Long id) {
        return taskFlowMapper.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("TaskFlow", id));
    }
}
