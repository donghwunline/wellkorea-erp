package com.wellkorea.backend.project.application;

import com.wellkorea.backend.auth.infrastructure.persistence.UserRepository;
import com.wellkorea.backend.company.infrastructure.persistence.CompanyRepository;
import com.wellkorea.backend.project.api.dto.CreateProjectRequest;
import com.wellkorea.backend.project.api.dto.UpdateProjectRequest;
import com.wellkorea.backend.project.domain.JobCodeGenerator;
import com.wellkorea.backend.project.domain.Project;
import com.wellkorea.backend.project.domain.ProjectStatus;
import com.wellkorea.backend.project.infrastructure.repository.ProjectRepository;
import com.wellkorea.backend.shared.exception.BusinessException;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Command service for project write operations.
 * Part of CQRS pattern - handles all create/update/delete operations.
 * Returns only entity IDs - clients should fetch fresh data via ProjectQueryService.
 */
@Service
@Transactional
public class ProjectCommandService {

    private final ProjectRepository projectRepository;
    private final JobCodeGenerator jobCodeGenerator;
    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;

    public ProjectCommandService(
            ProjectRepository projectRepository,
            JobCodeGenerator jobCodeGenerator,
            CompanyRepository companyRepository,
            UserRepository userRepository
    ) {
        this.projectRepository = projectRepository;
        this.jobCodeGenerator = jobCodeGenerator;
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
    }

    /**
     * Create a new project with auto-generated JobCode.
     *
     * @param request Create project request
     * @param createdById ID of the user creating the project
     * @return ID of the created project
     * @throws BusinessException if customer or internal owner doesn't exist
     */
    public Long createProject(CreateProjectRequest request, Long createdById) {
        // Validate customer exists
        if (!customerExists(request.customerId())) {
            throw new BusinessException("Customer with ID " + request.customerId() + " does not exist");
        }

        // Validate internal owner exists
        if (!userExists(request.internalOwnerId())) {
            throw new BusinessException("User with ID " + request.internalOwnerId() + " does not exist");
        }

        // Generate unique JobCode
        String jobCode = jobCodeGenerator.generateJobCode();

        // Build project entity
        Project project = Project.builder()
                .jobCode(jobCode)
                .customerId(request.customerId())
                .projectName(request.projectName())
                .requesterName(request.requesterName())
                .dueDate(request.dueDate())
                .internalOwnerId(request.internalOwnerId())
                .status(ProjectStatus.DRAFT)
                .createdById(createdById)
                .build();

        Project saved = projectRepository.save(project);
        return saved.getId();
    }

    /**
     * Update an existing project.
     *
     * @param id Project ID
     * @param request Update request
     * @return ID of the updated project
     * @throws ResourceNotFoundException if project not found
     * @throws BusinessException if project is not editable or status is invalid
     */
    public Long updateProject(Long id, UpdateProjectRequest request) {
        Project project = projectRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project", id));

        if (!project.isEditable()) {
            throw new BusinessException("Project with status " + project.getStatus() + " cannot be edited");
        }

        // Parse and validate status if provided
        ProjectStatus newStatus = null;
        if (request.status() != null && !request.status().isBlank()) {
            newStatus = ProjectStatus.fromString(request.status());
            if (newStatus == null) {
                throw new BusinessException("Invalid status: " + request.status());
            }
        }

        Project updatedProject = project.withUpdatedFields(
                request.projectName(),
                request.requesterName(),
                request.dueDate(),
                newStatus
        );

        Project saved = projectRepository.save(updatedProject);
        return saved.getId();
    }

    /**
     * Soft delete a project.
     *
     * @param id Project ID
     * @return ID of the deleted project
     * @throws ResourceNotFoundException if project not found
     */
    public Long deleteProject(Long id) {
        Project project = projectRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project", id));

        Project deletedProject = project.delete();
        projectRepository.save(deletedProject);
        return id;
    }

    /**
     * Check if company exists and is active (used for customer validation).
     */
    private boolean customerExists(Long customerId) {
        return companyRepository.existsByIdAndIsActiveTrue(customerId);
    }

    /**
     * Check if user exists and is active.
     */
    private boolean userExists(Long userId) {
        return userRepository.existsByIdAndIsActiveTrue(userId);
    }
}
