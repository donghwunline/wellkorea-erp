package com.wellkorea.backend.project.application;

import com.wellkorea.backend.auth.domain.User;
import com.wellkorea.backend.auth.infrastructure.persistence.UserRepository;
import com.wellkorea.backend.company.domain.Company;
import com.wellkorea.backend.company.infrastructure.persistence.CompanyRepository;
import com.wellkorea.backend.project.api.dto.query.ProjectDetailView;
import com.wellkorea.backend.project.api.dto.query.ProjectSummaryView;
import com.wellkorea.backend.project.domain.Project;
import com.wellkorea.backend.project.domain.ProjectStatus;
import com.wellkorea.backend.project.infrastructure.repository.ProjectRepository;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Query service for project read operations.
 * Part of CQRS pattern - handles all read/query operations.
 * All methods are read-only and return view DTOs optimized for specific use cases.
 */
@Service
@Transactional(readOnly = true)
public class ProjectQueryService {

    private final ProjectRepository projectRepository;
    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;

    public ProjectQueryService(
            ProjectRepository projectRepository,
            CompanyRepository companyRepository,
            UserRepository userRepository
    ) {
        this.projectRepository = projectRepository;
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
    }

    /**
     * Get project detail by ID.
     * Returns full detail view including resolved customer and user names.
     *
     * @param projectId Project ID
     * @return Project detail view with resolved names
     * @throws ResourceNotFoundException if project not found
     */
    public ProjectDetailView getProjectDetail(Long projectId) {
        Project project = projectRepository.findByIdAndIsDeletedFalse(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));

        Company customer = companyRepository.findById(project.getCustomerId()).orElse(null);
        User internalOwner = userRepository.findById(project.getInternalOwnerId()).orElse(null);
        User createdBy = userRepository.findById(project.getCreatedById()).orElse(null);

        return ProjectDetailView.from(project, customer, internalOwner, createdBy);
    }

    /**
     * Get project detail by JobCode.
     *
     * @param jobCode Job code
     * @return Project detail view with resolved names
     * @throws ResourceNotFoundException if project not found
     */
    public ProjectDetailView getProjectDetailByJobCode(String jobCode) {
        Project project = projectRepository.findByJobCode(jobCode)
                .filter(p -> !p.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Project with JobCode: " + jobCode));

        Company customer = companyRepository.findById(project.getCustomerId()).orElse(null);
        User internalOwner = userRepository.findById(project.getInternalOwnerId()).orElse(null);
        User createdBy = userRepository.findById(project.getCreatedById()).orElse(null);

        return ProjectDetailView.from(project, customer, internalOwner, createdBy);
    }

    /**
     * List all projects (paginated).
     * Returns summary views optimized for list display.
     *
     * @param pageable Pagination parameters
     * @return Page of project summary views
     */
    public Page<ProjectSummaryView> listProjects(Pageable pageable) {
        Page<Project> projects = projectRepository.findByIsDeletedFalse(pageable);
        return mapToSummaryViews(projects);
    }

    /**
     * List projects by status (paginated).
     *
     * @param status Project status filter
     * @param pageable Pagination parameters
     * @return Page of project summary views
     */
    public Page<ProjectSummaryView> listProjectsByStatus(ProjectStatus status, Pageable pageable) {
        Page<Project> projects = projectRepository.findByStatusAndIsDeletedFalse(status, pageable);
        return mapToSummaryViews(projects);
    }

    /**
     * List projects for specific customers (for Sales role filtering).
     *
     * @param customerIds List of customer IDs
     * @param pageable Pagination parameters
     * @return Page of project summary views
     */
    public Page<ProjectSummaryView> listProjectsByCustomers(List<Long> customerIds, Pageable pageable) {
        if (customerIds == null || customerIds.isEmpty()) {
            return Page.empty(pageable);
        }
        Page<Project> projects = projectRepository.findByCustomerIdInAndIsDeletedFalse(customerIds, pageable);
        return mapToSummaryViews(projects);
    }

    /**
     * List projects for specific customers with status filter.
     *
     * @param customerIds List of customer IDs
     * @param status Project status filter
     * @param pageable Pagination parameters
     * @return Page of project summary views
     */
    public Page<ProjectSummaryView> listProjectsByCustomersAndStatus(
            List<Long> customerIds, ProjectStatus status, Pageable pageable) {
        if (customerIds == null || customerIds.isEmpty()) {
            return Page.empty(pageable);
        }
        Page<Project> projects = projectRepository.findByCustomerIdInAndStatusAndIsDeletedFalse(
                customerIds, status, pageable);
        return mapToSummaryViews(projects);
    }

    /**
     * Search projects by JobCode or project name.
     *
     * @param searchTerm Search term
     * @param pageable Pagination parameters
     * @return Page of project summary views
     */
    public Page<ProjectSummaryView> searchProjects(String searchTerm, Pageable pageable) {
        if (searchTerm == null || searchTerm.isBlank()) {
            return listProjects(pageable);
        }
        Page<Project> projects = projectRepository.searchByJobCodeOrProjectName(searchTerm.trim(), pageable);
        return mapToSummaryViews(projects);
    }

    /**
     * Map projects to summary views with resolved customer names.
     * Batch loads customer names to avoid N+1 queries.
     */
    private Page<ProjectSummaryView> mapToSummaryViews(Page<Project> projects) {
        if (projects.isEmpty()) {
            return Page.empty(projects.getPageable());
        }

        // Collect all unique customer IDs
        Set<Long> customerIds = projects.getContent().stream()
                .map(Project::getCustomerId)
                .collect(Collectors.toSet());

        // Batch load companies
        Map<Long, Company> companyMap = companyRepository.findAllById(customerIds).stream()
                .collect(Collectors.toMap(Company::getId, Function.identity()));

        return projects.map(project -> {
            Company customer = companyMap.get(project.getCustomerId());
            return ProjectSummaryView.of(
                    project.getId(),
                    project.getJobCode(),
                    project.getCustomerId(),
                    customer != null ? customer.getName() : null,
                    project.getProjectName(),
                    project.getDueDate(),
                    project.getStatus(),
                    project.getCreatedAt(),
                    project.getUpdatedAt()
            );
        });
    }
}
