package com.wellkorea.backend.catalog.api;

import com.wellkorea.backend.catalog.api.dto.command.*;
import com.wellkorea.backend.catalog.api.dto.query.MaterialCategorySummaryView;
import com.wellkorea.backend.catalog.api.dto.query.MaterialDetailView;
import com.wellkorea.backend.catalog.api.dto.query.MaterialSummaryView;
import com.wellkorea.backend.catalog.api.dto.query.VendorMaterialOfferingView;
import com.wellkorea.backend.catalog.application.MaterialCategoryCommandService;
import com.wellkorea.backend.catalog.application.MaterialCategoryQueryService;
import com.wellkorea.backend.catalog.application.MaterialCommandService;
import com.wellkorea.backend.catalog.application.MaterialQueryService;
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
 * REST API controller for material and material category management.
 * Follows CQRS pattern - uses separate Command and Query services.
 * <p>
 * RBAC Rules:
 * - Admin, Finance: Full CRUD access
 * - Sales, Production: Read-only access
 */
@RestController
@RequestMapping("/api/materials")
public class MaterialController {

    private final MaterialCommandService materialCommandService;
    private final MaterialQueryService materialQueryService;
    private final MaterialCategoryCommandService categoryCommandService;
    private final MaterialCategoryQueryService categoryQueryService;

    public MaterialController(MaterialCommandService materialCommandService,
                              MaterialQueryService materialQueryService,
                              MaterialCategoryCommandService categoryCommandService,
                              MaterialCategoryQueryService categoryQueryService) {
        this.materialCommandService = materialCommandService;
        this.materialQueryService = materialQueryService;
        this.categoryCommandService = categoryCommandService;
        this.categoryQueryService = categoryQueryService;
    }

    // ========== MATERIAL QUERY ENDPOINTS ==========

    /**
     * List all materials (paginated).
     * <p>
     * GET /api/materials
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<MaterialSummaryView>>> listMaterials(@RequestParam(required = false) Long categoryId,
                                                                                @RequestParam(required = false) String search,
                                                                                @RequestParam(defaultValue = "true") boolean activeOnly,
                                                                                Pageable pageable) {

        Page<MaterialSummaryView> materials = materialQueryService.listMaterials(categoryId, search, activeOnly, pageable);

        return ResponseEntity.ok(ApiResponse.success(materials));
    }

    /**
     * Get all active materials (for dropdown).
     * <p>
     * GET /api/materials/all
     */
    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<MaterialSummaryView>>> getAllMaterials() {
        List<MaterialSummaryView> materials = materialQueryService.getAllActiveMaterials();
        return ResponseEntity.ok(ApiResponse.success(materials));
    }

    /**
     * Get material by ID.
     * <p>
     * GET /api/materials/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MaterialDetailView>> getMaterial(@PathVariable Long id) {
        MaterialDetailView material = materialQueryService.getMaterialDetail(id);
        return ResponseEntity.ok(ApiResponse.success(material));
    }

    /**
     * Get current vendor offerings for a material.
     * Returns only offerings within their effective date range.
     * <p>
     * GET /api/materials/{id}/offerings/current
     */
    @GetMapping("/{id}/offerings/current")
    public ResponseEntity<ApiResponse<List<VendorMaterialOfferingView>>> getCurrentOfferingsForMaterial(@PathVariable Long id) {
        List<VendorMaterialOfferingView> offerings = materialQueryService.getCurrentOfferingsForMaterial(id);
        return ResponseEntity.ok(ApiResponse.success(offerings));
    }

    /**
     * Get all vendor offerings for a material (paginated).
     * <p>
     * GET /api/materials/{id}/offerings
     */
    @GetMapping("/{id}/offerings")
    public ResponseEntity<ApiResponse<Page<VendorMaterialOfferingView>>> getOfferingsForMaterial(@PathVariable Long id,
                                                                                                 Pageable pageable) {
        Page<VendorMaterialOfferingView> offerings = materialQueryService.getOfferingsForMaterial(id, pageable);
        return ResponseEntity.ok(ApiResponse.success(offerings));
    }

    // ========== MATERIAL COMMAND ENDPOINTS ==========

    /**
     * Create a new material.
     * <p>
     * POST /api/materials
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE')")
    public ResponseEntity<ApiResponse<MaterialCommandResult>> createMaterial(@Valid @RequestBody CreateMaterialRequest request) {

        Long materialId = materialCommandService.createMaterial(request.toCommand());
        MaterialCommandResult result = MaterialCommandResult.created(materialId);

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(result));
    }

    /**
     * Update a material.
     * <p>
     * PUT /api/materials/{id}
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE')")
    public ResponseEntity<ApiResponse<MaterialCommandResult>> updateMaterial(@PathVariable Long id,
                                                                             @Valid @RequestBody UpdateMaterialRequest request) {

        Long materialId = materialCommandService.updateMaterial(id, request.toCommand());
        MaterialCommandResult result = MaterialCommandResult.updated(materialId);

        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * Delete a material (soft delete).
     * <p>
     * DELETE /api/materials/{id}
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteMaterial(@PathVariable Long id) {
        materialCommandService.deactivateMaterial(id);
        return ResponseEntity.noContent().build();
    }

    // ========== VENDOR MATERIAL OFFERING COMMAND ENDPOINTS ==========

    /**
     * Create a vendor material offering.
     * <p>
     * POST /api/materials/offerings
     * <p>
     * Access: ADMIN, FINANCE
     *
     * @param request Create request
     * @return Created ID with 201 status
     */
    @PostMapping("/offerings")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE')")
    public ResponseEntity<ApiResponse<VendorMaterialOfferingCommandResult>> createVendorMaterialOffering(
            @Valid @RequestBody CreateVendorMaterialOfferingRequest request) {

        Long offeringId = materialCommandService.createVendorMaterialOffering(request.toCommand());
        VendorMaterialOfferingCommandResult result = VendorMaterialOfferingCommandResult.created(offeringId);

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(result));
    }

    /**
     * Update a vendor material offering.
     * <p>
     * PUT /api/materials/offerings/{offeringId}
     * <p>
     * Access: ADMIN, FINANCE
     *
     * @param offeringId Offering ID
     * @param request    Update request
     * @return Updated ID
     */
    @PutMapping("/offerings/{offeringId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE')")
    public ResponseEntity<ApiResponse<VendorMaterialOfferingCommandResult>> updateVendorMaterialOffering(
            @PathVariable Long offeringId,
            @Valid @RequestBody UpdateVendorMaterialOfferingRequest request) {

        Long id = materialCommandService.updateVendorMaterialOffering(offeringId, request.toCommand());
        VendorMaterialOfferingCommandResult result = VendorMaterialOfferingCommandResult.updated(id);

        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * Delete a vendor material offering (hard delete).
     * <p>
     * DELETE /api/materials/offerings/{offeringId}
     * <p>
     * Access: ADMIN, FINANCE
     *
     * @param offeringId Offering ID
     * @return 204 No Content
     */
    @DeleteMapping("/offerings/{offeringId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE')")
    public ResponseEntity<Void> deleteVendorMaterialOffering(@PathVariable Long offeringId) {
        materialCommandService.deleteVendorMaterialOffering(offeringId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Get vendor material offering by ID.
     * <p>
     * GET /api/materials/offerings/{offeringId}
     * <p>
     * Access: All authenticated users
     *
     * @param offeringId Offering ID
     * @return Vendor material offering details
     */
    @GetMapping("/offerings/{offeringId}")
    public ResponseEntity<ApiResponse<VendorMaterialOfferingView>> getVendorMaterialOffering(
            @PathVariable Long offeringId) {
        VendorMaterialOfferingView offering = materialQueryService.getOfferingById(offeringId);
        return ResponseEntity.ok(ApiResponse.success(offering));
    }

    /**
     * Set a vendor material offering as preferred.
     * <p>
     * PUT /api/materials/offerings/{offeringId}/preferred
     * <p>
     * Access: ADMIN, FINANCE
     *
     * @param offeringId Offering ID to set as preferred
     * @return Updated offering ID
     */
    @PutMapping("/offerings/{offeringId}/preferred")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE')")
    public ResponseEntity<ApiResponse<VendorMaterialOfferingCommandResult>> setPreferredVendorOffering(
            @PathVariable Long offeringId) {

        Long id = materialCommandService.setPreferredVendorOffering(offeringId);
        VendorMaterialOfferingCommandResult result = VendorMaterialOfferingCommandResult.updated(id);

        return ResponseEntity.ok(ApiResponse.success(result));
    }

    // ========== CATEGORY QUERY ENDPOINTS ==========

    /**
     * List all material categories (paginated).
     * <p>
     * GET /api/materials/categories
     */
    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<Page<MaterialCategorySummaryView>>> listCategories(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "true") boolean activeOnly,
            Pageable pageable) {

        Page<MaterialCategorySummaryView> categories = categoryQueryService.listCategories(
                search, activeOnly, pageable);

        return ResponseEntity.ok(ApiResponse.success(categories));
    }

    /**
     * Get all active categories (for dropdown).
     * <p>
     * GET /api/materials/categories/all
     */
    @GetMapping("/categories/all")
    public ResponseEntity<ApiResponse<List<MaterialCategorySummaryView>>> getAllCategories() {
        List<MaterialCategorySummaryView> categories = categoryQueryService.getAllActiveCategories();
        return ResponseEntity.ok(ApiResponse.success(categories));
    }

    /**
     * Get category by ID.
     * <p>
     * GET /api/materials/categories/{id}
     */
    @GetMapping("/categories/{id}")
    public ResponseEntity<ApiResponse<MaterialCategorySummaryView>> getCategory(@PathVariable Long id) {
        MaterialCategorySummaryView category = categoryQueryService.getCategoryDetail(id);
        return ResponseEntity.ok(ApiResponse.success(category));
    }

    // ========== CATEGORY COMMAND ENDPOINTS ==========

    /**
     * Create a new material category.
     * <p>
     * POST /api/materials/categories
     */
    @PostMapping("/categories")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE')")
    public ResponseEntity<ApiResponse<MaterialCategoryCommandResult>> createCategory(
            @Valid @RequestBody CreateMaterialCategoryRequest request) {

        Long categoryId = categoryCommandService.createMaterialCategory(request.toCommand());
        MaterialCategoryCommandResult result = MaterialCategoryCommandResult.created(categoryId);

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(result));
    }

    /**
     * Update a material category.
     * <p>
     * PUT /api/materials/categories/{id}
     */
    @PutMapping("/categories/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE')")
    public ResponseEntity<ApiResponse<MaterialCategoryCommandResult>> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody UpdateMaterialCategoryRequest request) {

        Long categoryId = categoryCommandService.updateMaterialCategory(id, request.toCommand());
        MaterialCategoryCommandResult result = MaterialCategoryCommandResult.updated(categoryId);

        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * Delete a material category (soft delete).
     * <p>
     * DELETE /api/materials/categories/{id}
     */
    @DeleteMapping("/categories/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        categoryCommandService.deactivateMaterialCategory(id);
        return ResponseEntity.noContent().build();
    }
}
