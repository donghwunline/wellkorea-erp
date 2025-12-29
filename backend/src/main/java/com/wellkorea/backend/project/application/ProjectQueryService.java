package com.wellkorea.backend.project.application;

import com.wellkorea.backend.project.api.dto.query.ProjectDetailView;
import com.wellkorea.backend.project.api.dto.query.ProjectSummaryView;
import com.wellkorea.backend.project.domain.ProjectStatus;
import com.wellkorea.backend.project.infrastructure.mapper.ProjectMapper;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Query service for project read operations.
 * Part of CQRS pattern - handles all read/query operations.
 * All methods are read-only and return view DTOs optimized for specific use cases.
 *
 * <p>Uses MyBatis for all queries to avoid N+1 issues on Company and User entities.
 */
@Service
@Transactional(readOnly = true)
public class ProjectQueryService {

    private final ProjectMapper projectMapper;

    public ProjectQueryService(ProjectMapper projectMapper) {
        this.projectMapper = projectMapper;
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
        return projectMapper.findDetailById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));
    }

    /**
     * Get project detail by JobCode.
     *
     * @param jobCode Job code
     * @return Project detail view with resolved names
     * @throws ResourceNotFoundException if project not found
     */
    public ProjectDetailView getProjectDetailByJobCode(String jobCode) {
        return projectMapper.findDetailByJobCode(jobCode)
                .orElseThrow(() -> new ResourceNotFoundException("Project with JobCode: " + jobCode));
    }

    /**
     * List all projects (paginated).
     * Returns summary views optimized for list display.
     *
     * @param pageable Pagination parameters
     * @return Page of project summary views
     */
    public Page<ProjectSummaryView> listProjects(Pageable pageable) {
        List<ProjectSummaryView> content = projectMapper.findWithFilters(
                null, null, null, pageable.getPageSize(), pageable.getOffset());
        long total = projectMapper.countWithFilters(null, null, null);
        return new PageImpl<>(content, pageable, total);
    }

    /**
     * List projects by status (paginated).
     *
     * @param status   Project status filter
     * @param pageable Pagination parameters
     * @return Page of project summary views
     */
    public Page<ProjectSummaryView> listProjectsByStatus(ProjectStatus status, Pageable pageable) {
        List<ProjectSummaryView> content = projectMapper.findWithFilters(
                status, null, null, pageable.getPageSize(), pageable.getOffset());
        long total = projectMapper.countWithFilters(status, null, null);
        return new PageImpl<>(content, pageable, total);
    }

    /**
     * List projects for specific customers (for Sales role filtering).
     *
     * @param customerIds List of customer IDs
     * @param pageable    Pagination parameters
     * @return Page of project summary views
     */
    public Page<ProjectSummaryView> listProjectsByCustomers(List<Long> customerIds, Pageable pageable) {
        if (customerIds == null || customerIds.isEmpty()) {
            return Page.empty(pageable);
        }
        List<ProjectSummaryView> content = projectMapper.findWithFilters(
                null, customerIds, null, pageable.getPageSize(), pageable.getOffset());
        long total = projectMapper.countWithFilters(null, customerIds, null);
        return new PageImpl<>(content, pageable, total);
    }

    /**
     * List projects for specific customers with status filter.
     *
     * @param customerIds List of customer IDs
     * @param status      Project status filter
     * @param pageable    Pagination parameters
     * @return Page of project summary views
     */
    public Page<ProjectSummaryView> listProjectsByCustomersAndStatus(
            List<Long> customerIds, ProjectStatus status, Pageable pageable) {
        if (customerIds == null || customerIds.isEmpty()) {
            return Page.empty(pageable);
        }
        List<ProjectSummaryView> content = projectMapper.findWithFilters(
                status, customerIds, null, pageable.getPageSize(), pageable.getOffset());
        long total = projectMapper.countWithFilters(status, customerIds, null);
        return new PageImpl<>(content, pageable, total);
    }

    /**
     * Search projects by JobCode or project name.
     *
     * @param searchTerm Search term
     * @param pageable   Pagination parameters
     * @return Page of project summary views
     */
    public Page<ProjectSummaryView> searchProjects(String searchTerm, Pageable pageable) {
        String search = (searchTerm == null || searchTerm.isBlank()) ? null : searchTerm.trim();
        List<ProjectSummaryView> content = projectMapper.findWithFilters(
                null, null, search, pageable.getPageSize(), pageable.getOffset());
        long total = projectMapper.countWithFilters(null, null, search);
        return new PageImpl<>(content, pageable, total);
    }
}
