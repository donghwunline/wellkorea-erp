package com.wellkorea.backend.project.application;

import com.wellkorea.backend.delivery.infrastructure.mapper.DeliveryMapper;
import com.wellkorea.backend.invoice.infrastructure.mapper.InvoiceMapper;
import com.wellkorea.backend.production.infrastructure.persistence.BlueprintAttachmentRepository;
import com.wellkorea.backend.production.infrastructure.persistence.TaskFlowRepository;
import com.wellkorea.backend.project.api.dto.query.ProjectDetailView;
import com.wellkorea.backend.project.api.dto.query.ProjectSectionSummaryView;
import com.wellkorea.backend.project.api.dto.query.ProjectSectionsSummaryView;
import com.wellkorea.backend.project.api.dto.query.ProjectSummaryView;
import com.wellkorea.backend.project.domain.ProjectStatus;
import com.wellkorea.backend.project.infrastructure.mapper.ProjectMapper;
import com.wellkorea.backend.purchasing.infrastructure.mapper.PurchaseRequestMapper;
import com.wellkorea.backend.quotation.infrastructure.mapper.QuotationMapper;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
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
    private final QuotationMapper quotationMapper;
    private final TaskFlowRepository taskFlowRepository;
    private final PurchaseRequestMapper purchaseRequestMapper;
    private final BlueprintAttachmentRepository blueprintAttachmentRepository;
    private final DeliveryMapper deliveryMapper;
    private final InvoiceMapper invoiceMapper;

    public ProjectQueryService(
            ProjectMapper projectMapper,
            QuotationMapper quotationMapper,
            TaskFlowRepository taskFlowRepository,
            PurchaseRequestMapper purchaseRequestMapper,
            BlueprintAttachmentRepository blueprintAttachmentRepository,
            DeliveryMapper deliveryMapper,
            InvoiceMapper invoiceMapper
    ) {
        this.projectMapper = projectMapper;
        this.quotationMapper = quotationMapper;
        this.taskFlowRepository = taskFlowRepository;
        this.purchaseRequestMapper = purchaseRequestMapper;
        this.blueprintAttachmentRepository = blueprintAttachmentRepository;
        this.deliveryMapper = deliveryMapper;
        this.invoiceMapper = invoiceMapper;
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

    /**
     * Get project sections summary for tab badge counts.
     * Returns counts for each section (quotation, process, purchase, outsource, documents, delivery, finance).
     *
     * @param projectId Project ID
     * @return Project sections summary with counts for each tab
     * @throws ResourceNotFoundException if project not found
     */
    public ProjectSectionsSummaryView getProjectSummary(Long projectId) {
        // Verify project exists
        projectMapper.findDetailById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));

        List<ProjectSectionSummaryView> sections = new ArrayList<>();

        // 1. Quotation (견적) - total quotations linked to this project
        long quotationTotal = quotationMapper.countWithFilters(null, projectId);
        sections.add(ProjectSectionSummaryView.of("quotation", "견적", (int) quotationTotal, 0));

        // 2. Process (공정) - total nodes linked to this project
        var taskFlowOpt = taskFlowRepository.findByProjectId(projectId);
        int nodeCount = taskFlowOpt.map(flow -> flow.getNodes().size()).orElse(0);
        sections.add(ProjectSectionSummaryView.of("process", "공정", nodeCount, 0));

        // 3. Purchase (구매) - total MaterialPurchaseRequest linked to this project
        long materialPurchaseTotal = purchaseRequestMapper.countWithFilters(null, projectId, "MATERIAL");
        sections.add(ProjectSectionSummaryView.of("purchase", "구매", (int) materialPurchaseTotal, 0));

        // 4. Outsource (외주) - total ServicePurchaseRequest linked to this project
        long servicePurchaseTotal = purchaseRequestMapper.countWithFilters(null, projectId, "SERVICE");
        sections.add(ProjectSectionSummaryView.of("outsource", "외주", (int) servicePurchaseTotal, 0));

        // 5. Documents (문서) - total BlueprintAttachment linked to this project
        int documentTotal = blueprintAttachmentRepository.findByProjectId(projectId).size();
        sections.add(ProjectSectionSummaryView.of("documents", "문서", documentTotal, 0));

        // 6. Delivery (출고) - total Delivery linked to this project
        long deliveryTotal = deliveryMapper.countWithFilters(projectId, null);
        sections.add(ProjectSectionSummaryView.of("delivery", "출고", (int) deliveryTotal, 0));

        // 7. Finance (정산) - total TaxInvoice linked to this project
        long invoiceTotal = invoiceMapper.countWithFilters(projectId, null);
        sections.add(ProjectSectionSummaryView.of("finance", "정산", (int) invoiceTotal, 0));

        return ProjectSectionsSummaryView.of(projectId, sections);
    }
}
