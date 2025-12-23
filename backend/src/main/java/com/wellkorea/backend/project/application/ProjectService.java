package com.wellkorea.backend.project.application;

import com.wellkorea.backend.auth.infrastructure.persistence.UserRepository;
import com.wellkorea.backend.company.infrastructure.persistence.CompanyRepository;
import com.wellkorea.backend.project.api.dto.CreateProjectRequest;
import com.wellkorea.backend.project.api.dto.UpdateProjectRequest;
import com.wellkorea.backend.project.domain.Project;
import com.wellkorea.backend.project.domain.ProjectStatus;
import com.wellkorea.backend.project.domain.JobCodeGenerator;
import com.wellkorea.backend.project.infrastructure.repository.ProjectRepository;
import com.wellkorea.backend.shared.exception.BusinessException;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Application service for project management.
 * Orchestrates project creation, update, and query operations.
 * <p>
 * Handles business logic including:
 * - JobCode generation on project creation
 * - Validation of customer and internal owner existence
 * - Status transition validation
 * - Soft delete operations
 */
@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final JobCodeGenerator jobCodeGenerator;
    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;

    public ProjectService(
            ProjectRepository projectRepository,
            JobCodeGenerator jobCodeGenerator,
            CompanyRepository companyRepository,
            UserRepository userRepository) {
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
     * @return Created project with generated JobCode
     * @throws ValidationException if customer or internal owner doesn't exist
     */
    @Transactional
    public Project createProject(CreateProjectRequest request, Long createdById) {
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

        return projectRepository.save(project);
    }

    /**
     * Get project by ID.
     *
     * @param id Project ID
     * @return Project if found
     * @throws ResourceNotFoundException if project not found
     */
    @Transactional(readOnly = true)
    public Project getProject(Long id) {
        return projectRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project", id));
    }

    /**
     * Get project by JobCode.
     *
     * @param jobCode Unique business identifier
     * @return Project if found
     * @throws ResourceNotFoundException if project not found
     */
    @Transactional(readOnly = true)
    public Project getProjectByJobCode(String jobCode) {
        return projectRepository.findByJobCode(jobCode)
                .filter(p -> !p.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Project with JobCode: " + jobCode));
    }

    /**
     * List all projects (paginated).
     *
     * @param pageable Pagination parameters
     * @return Page of projects
     */
    @Transactional(readOnly = true)
    public Page<Project> listProjects(Pageable pageable) {
        return projectRepository.findByIsDeletedFalse(pageable);
    }

    /**
     * List projects by status (paginated).
     *
     * @param status Project status filter
     * @param pageable Pagination parameters
     * @return Page of projects matching status
     */
    @Transactional(readOnly = true)
    public Page<Project> listProjectsByStatus(ProjectStatus status, Pageable pageable) {
        return projectRepository.findByStatusAndIsDeletedFalse(status, pageable);
    }

    /**
     * List projects for specific customers (for Sales role filtering).
     *
     * @param customerIds List of customer IDs
     * @param pageable Pagination parameters
     * @return Page of projects for the specified customers
     */
    @Transactional(readOnly = true)
    public Page<Project> listProjectsByCustomers(List<Long> customerIds, Pageable pageable) {
        if (customerIds == null || customerIds.isEmpty()) {
            return Page.empty(pageable);
        }
        return projectRepository.findByCustomerIdInAndIsDeletedFalse(customerIds, pageable);
    }

    /**
     * List projects for specific customers with status filter.
     *
     * @param customerIds List of customer IDs
     * @param status Project status filter
     * @param pageable Pagination parameters
     * @return Page of projects matching filters
     */
    @Transactional(readOnly = true)
    public Page<Project> listProjectsByCustomersAndStatus(
            List<Long> customerIds, ProjectStatus status, Pageable pageable) {
        if (customerIds == null || customerIds.isEmpty()) {
            return Page.empty(pageable);
        }
        return projectRepository.findByCustomerIdInAndStatusAndIsDeletedFalse(
                customerIds, status, pageable);
    }

    /**
     * Search projects by JobCode or project name.
     *
     * @param searchTerm Search term
     * @param pageable Pagination parameters
     * @return Page of matching projects
     */
    @Transactional(readOnly = true)
    public Page<Project> searchProjects(String searchTerm, Pageable pageable) {
        if (searchTerm == null || searchTerm.isBlank()) {
            return listProjects(pageable);
        }
        return projectRepository.searchByJobCodeOrProjectName(searchTerm.trim(), pageable);
    }

    /**
     * Update an existing project.
     *
     * @param id Project ID
     * @param request Update request
     * @return Updated project
     * @throws ResourceNotFoundException if project not found
     * @throws ValidationException if project is not editable or status is invalid
     */
    @Transactional
    public Project updateProject(Long id, UpdateProjectRequest request) {
        Project project = getProject(id);

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

        return projectRepository.save(updatedProject);
    }

    /**
     * Soft delete a project.
     *
     * @param id Project ID
     * @throws ResourceNotFoundException if project not found
     */
    @Transactional
    public void deleteProject(Long id) {
        Project project = getProject(id);
        Project deletedProject = project.delete();
        projectRepository.save(deletedProject);
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
