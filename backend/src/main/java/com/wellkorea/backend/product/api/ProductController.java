package com.wellkorea.backend.product.api;

import com.wellkorea.backend.product.api.dto.command.CreateProductRequest;
import com.wellkorea.backend.product.api.dto.command.ProductCommandResult;
import com.wellkorea.backend.product.api.dto.command.UpdateProductRequest;
import com.wellkorea.backend.product.api.dto.query.ProductDetailView;
import com.wellkorea.backend.product.api.dto.query.ProductSummaryView;
import com.wellkorea.backend.product.api.dto.query.ProductTypeView;
import com.wellkorea.backend.product.application.ProductCommandService;
import com.wellkorea.backend.product.application.ProductQueryService;
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
 * REST API controller for product management.
 * Follows CQRS pattern - uses separate Command and Query services.
 * Command endpoints return only IDs; clients fetch fresh data via query endpoints.
 * <p>
 * RBAC Rules:
 * - Admin, Finance: Full CRUD access
 * - Sales, Production: Read-only access
 */
@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductCommandService commandService;
    private final ProductQueryService queryService;

    public ProductController(ProductCommandService commandService, ProductQueryService queryService) {
        this.commandService = commandService;
        this.queryService = queryService;
    }

    // ========== QUERY ENDPOINTS ==========

    /**
     * List all products (paginated).
     * <p>
     * GET /api/products
     * <p>
     * Access: All authenticated users
     *
     * @param productTypeId Optional product type filter
     * @param search        Optional search term (name or SKU)
     * @param pageable      Pagination parameters
     * @return Paginated list of products
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<ProductSummaryView>>> listProducts(@RequestParam(required = false) Long productTypeId,
                                                                              @RequestParam(required = false) String search,
                                                                              Pageable pageable) {

        Page<ProductSummaryView> productsPage;

        if (productTypeId != null && search != null && !search.isBlank()) {
            productsPage = queryService.findByProductTypeAndSearch(productTypeId, search, pageable);
        } else if (productTypeId != null) {
            productsPage = queryService.findByProductType(productTypeId, pageable);
        } else if (search != null && !search.isBlank()) {
            productsPage = queryService.searchProducts(search, pageable);
        } else {
            productsPage = queryService.listProducts(pageable);
        }

        return ResponseEntity.ok(ApiResponse.success(productsPage));
    }

    /**
     * Get product by ID.
     * <p>
     * GET /api/products/{id}
     * <p>
     * Access: All authenticated users
     *
     * @param id Product ID
     * @return Product details
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductDetailView>> getProduct(@PathVariable Long id) {
        ProductDetailView product = queryService.getProductDetail(id);
        return ResponseEntity.ok(ApiResponse.success(product));
    }

    /**
     * Get all product types.
     * <p>
     * GET /api/products/types
     * <p>
     * Access: All authenticated users
     *
     * @return List of product types
     */
    @GetMapping("/types")
    public ResponseEntity<ApiResponse<List<ProductTypeView>>> getProductTypes() {
        List<ProductTypeView> productTypes = queryService.getAllProductTypes();
        return ResponseEntity.ok(ApiResponse.success(productTypes));
    }

    // ========== COMMAND ENDPOINTS ==========

    /**
     * Create a new product.
     * <p>
     * POST /api/products
     * <p>
     * Access: ADMIN, FINANCE
     *
     * @param request Create product request
     * @return Created product ID with 201 status
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE')")
    public ResponseEntity<ApiResponse<ProductCommandResult>> createProduct(@Valid @RequestBody CreateProductRequest request) {

        Long productId = commandService.createProduct(request.toCommand());
        ProductCommandResult result = ProductCommandResult.created(productId);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(result));
    }

    /**
     * Update an existing product.
     * <p>
     * PUT /api/products/{id}
     * <p>
     * Access: ADMIN, FINANCE
     *
     * @param id      Product ID
     * @param request Update request
     * @return Updated product ID
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE')")
    public ResponseEntity<ApiResponse<ProductCommandResult>> updateProduct(@PathVariable Long id,
                                                                           @Valid @RequestBody UpdateProductRequest request) {

        Long productId = commandService.updateProduct(id, request.toCommand());
        ProductCommandResult result = ProductCommandResult.updated(productId);

        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * Delete a product (soft delete - deactivate).
     * <p>
     * DELETE /api/products/{id}
     * <p>
     * Access: ADMIN only
     *
     * @param id Product ID
     * @return 204 No Content
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        commandService.deactivateProduct(id);
        return ResponseEntity.noContent().build();
    }
}
