package com.wellkorea.backend.catalog.api;

import com.wellkorea.backend.catalog.api.dto.command.*;
import com.wellkorea.backend.catalog.api.dto.query.ServiceCategoryDetailView;
import com.wellkorea.backend.catalog.api.dto.query.ServiceCategorySummaryView;
import com.wellkorea.backend.catalog.api.dto.query.VendorServiceOfferingView;
import com.wellkorea.backend.catalog.application.ServiceCategoryCommandService;
import com.wellkorea.backend.catalog.application.ServiceCategoryQueryService;
import com.wellkorea.backend.shared.dto.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST API controller for service category and vendor offering management.
 * Follows CQRS pattern - uses separate Command and Query services.
 * Command endpoints return only IDs; clients fetch fresh data via query endpoints.
 * <p>
 * RBAC Rules:
 * - Admin, Finance: Full CRUD access
 * - Sales, Production: Read-only access
 */
@RestController
@RequestMapping("/api/service-categories")
public class ServiceCategoryController {

    private final ServiceCategoryCommandService commandService;
    private final ServiceCategoryQueryService queryService;

    public ServiceCategoryController(ServiceCategoryCommandService commandService,
                                     ServiceCategoryQueryService queryService) {
        this.commandService = commandService;
        this.queryService = queryService;
    }

    // ========== SERVICE CATEGORY QUERY ENDPOINTS ==========

    /**
     * List all service categories (paginated).
     * <p>
     * GET /api/service-categories
     * <p>
     * Access: All authenticated users
     *
     * @param search   Optional search term
     * @param pageable Pagination parameters
     * @return Paginated list of service categories
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<ServiceCategorySummaryView>>> listServiceCategories(@RequestParam(required = false) String search,
                                                                                               Pageable pageable) {

        Page<ServiceCategorySummaryView> categoriesPage;

        if (search != null && !search.isBlank()) {
            categoriesPage = queryService.searchServiceCategories(search, pageable);
        } else {
            categoriesPage = queryService.listServiceCategories(pageable);
        }

        return ResponseEntity.ok(ApiResponse.success(categoriesPage));
    }

    /**
     * Get all service categories (for dropdown).
     * <p>
     * GET /api/service-categories/all
     * <p>
     * Access: All authenticated users
     *
     * @return List of all active service categories
     */
    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<ServiceCategorySummaryView>>> getAllServiceCategories() {
        List<ServiceCategorySummaryView> categories = queryService.getAllServiceCategories();
        return ResponseEntity.ok(ApiResponse.success(categories));
    }

    /**
     * Get service category by ID.
     * <p>
     * GET /api/service-categories/{id}
     * <p>
     * Access: All authenticated users
     *
     * @param id Service category ID
     * @return Service category details
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ServiceCategoryDetailView>> getServiceCategory(@PathVariable Long id) {
        ServiceCategoryDetailView category = queryService.getServiceCategoryDetail(id);
        return ResponseEntity.ok(ApiResponse.success(category));
    }

    // ========== SERVICE CATEGORY COMMAND ENDPOINTS ==========

    /**
     * Create a new service category.
     * <p>
     * POST /api/service-categories
     * <p>
     * Access: ADMIN, FINANCE
     *
     * @param request Create request
     * @return Created ID with 201 status
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE')")
    public ResponseEntity<ApiResponse<ServiceCategoryCommandResult>> createServiceCategory(@Valid @RequestBody CreateServiceCategoryRequest request) {

        Long categoryId = commandService.createServiceCategory(request.toCommand());
        ServiceCategoryCommandResult result = ServiceCategoryCommandResult.created(categoryId);

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(result));
    }

    /**
     * Update a service category.
     * <p>
     * PUT /api/service-categories/{id}
     * <p>
     * Access: ADMIN, FINANCE
     *
     * @param id      Service category ID
     * @param request Update request
     * @return Updated ID
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE')")
    public ResponseEntity<ApiResponse<ServiceCategoryCommandResult>> updateServiceCategory(@PathVariable Long id,
                                                                                           @Valid @RequestBody UpdateServiceCategoryRequest request) {

        Long categoryId = commandService.updateServiceCategory(id, request.toCommand());
        ServiceCategoryCommandResult result = ServiceCategoryCommandResult.updated(categoryId);

        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * Delete a service category (soft delete).
     * <p>
     * DELETE /api/service-categories/{id}
     * <p>
     * Access: ADMIN only
     *
     * @param id Service category ID
     * @return 204 No Content
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteServiceCategory(@PathVariable Long id) {
        commandService.deactivateServiceCategory(id);
        return ResponseEntity.noContent().build();
    }

    // ========== VENDOR OFFERING QUERY ENDPOINTS ==========

    /**
     * Get vendor offerings for a service category.
     * <p>
     * GET /api/service-categories/{id}/offerings
     * <p>
     * Access: All authenticated users
     *
     * @param id       Service category ID
     * @param pageable Pagination parameters
     * @return Paginated list of vendor offerings
     */
    @GetMapping("/{id}/offerings")
    public ResponseEntity<ApiResponse<Page<VendorServiceOfferingView>>> getOfferingsForCategory(@PathVariable Long id,
                                                                                                Pageable pageable) {

        Page<VendorServiceOfferingView> offerings = queryService.getOfferingsForServiceCategory(id, pageable);
        return ResponseEntity.ok(ApiResponse.success(offerings));
    }

    /**
     * Get current vendor offerings for a service category.
     * Only returns offerings within their effective date range.
     * <p>
     * GET /api/service-categories/{id}/offerings/current
     * <p>
     * Access: All authenticated users
     *
     * @param id Service category ID
     * @return List of current vendor offerings
     */
    @GetMapping("/{id}/offerings/current")
    public ResponseEntity<ApiResponse<List<VendorServiceOfferingView>>> getCurrentOfferingsForCategory(@PathVariable Long id) {

        List<VendorServiceOfferingView> offerings = queryService.getCurrentOfferingsForServiceCategory(id);
        return ResponseEntity.ok(ApiResponse.success(offerings));
    }

    // ========== VENDOR OFFERING COMMAND ENDPOINTS ==========

    /**
     * Create a vendor offering.
     * <p>
     * POST /api/service-categories/offerings
     * <p>
     * Access: ADMIN, FINANCE
     *
     * @param request Create request
     * @return Created ID with 201 status
     */
    @PostMapping("/offerings")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE')")
    public ResponseEntity<ApiResponse<VendorOfferingCommandResult>> createVendorOffering(
            @Valid @RequestBody CreateVendorOfferingRequest request) {

        Long offeringId = commandService.createVendorOffering(request.toCommand());
        VendorOfferingCommandResult result = VendorOfferingCommandResult.created(offeringId);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(result));
    }

    /**
     * Update a vendor offering.
     * <p>
     * PUT /api/service-categories/offerings/{offeringId}
     * <p>
     * Access: ADMIN, FINANCE
     *
     * @param offeringId Offering ID
     * @param request    Update request
     * @return Updated ID
     */
    @PutMapping("/offerings/{offeringId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE')")
    public ResponseEntity<ApiResponse<VendorOfferingCommandResult>> updateVendorOffering(
            @PathVariable Long offeringId,
            @Valid @RequestBody UpdateVendorOfferingRequest request) {

        Long id = commandService.updateVendorOffering(offeringId, request.toCommand());
        VendorOfferingCommandResult result = VendorOfferingCommandResult.updated(id);

        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * Delete a vendor offering.
     * <p>
     * DELETE /api/service-categories/offerings/{offeringId}
     * <p>
     * Access: ADMIN, FINANCE
     *
     * @param offeringId Offering ID
     * @return 204 No Content
     */
    @DeleteMapping("/offerings/{offeringId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE')")
    public ResponseEntity<Void> deleteVendorOffering(@PathVariable Long offeringId) {
        commandService.deleteVendorOffering(offeringId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Get vendor offering by ID.
     * <p>
     * GET /api/service-categories/offerings/{offeringId}
     * <p>
     * Access: All authenticated users
     *
     * @param offeringId Offering ID
     * @return Vendor offering details
     */
    @GetMapping("/offerings/{offeringId}")
    public ResponseEntity<ApiResponse<VendorServiceOfferingView>> getVendorOffering(@PathVariable Long offeringId) {
        VendorServiceOfferingView offering = queryService.getVendorOffering(offeringId);
        return ResponseEntity.ok(ApiResponse.success(offering));
    }
}
