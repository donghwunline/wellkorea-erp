package com.wellkorea.backend.product.application;

import com.wellkorea.backend.product.api.dto.query.ProductDetailView;
import com.wellkorea.backend.product.api.dto.query.ProductSummaryView;
import com.wellkorea.backend.product.api.dto.query.ProductTypeView;
import com.wellkorea.backend.product.infrastructure.mapper.ProductMapper;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Query service for product read operations.
 * Part of CQRS pattern - handles all read/query operations.
 * All methods are read-only and return view DTOs optimized for specific use cases.
 *
 * <p>Uses MyBatis for all queries to avoid N+1 issues on ProductType entity.
 */
@Service
@Transactional(readOnly = true)
public class ProductQueryService {

    private final ProductMapper productMapper;

    public ProductQueryService(ProductMapper productMapper) {
        this.productMapper = productMapper;
    }

    // ========== PRODUCT QUERIES ==========

    /**
     * Get product detail by ID.
     *
     * @param productId The product ID
     * @return Product detail view
     * @throws ResourceNotFoundException if product not found
     */
    public ProductDetailView getProductDetail(Long productId) {
        return productMapper.findDetailById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", productId));
    }

    /**
     * List all active products (paginated).
     *
     * @param pageable Pagination parameters
     * @return Page of product summary views
     */
    public Page<ProductSummaryView> listProducts(Pageable pageable) {
        List<ProductSummaryView> content = productMapper.findWithFilters(
                null, null, pageable.getPageSize(), pageable.getOffset());
        long total = productMapper.countWithFilters(null, null);
        return new PageImpl<>(content, pageable, total);
    }

    /**
     * Search products by name or SKU.
     *
     * @param search   Search term
     * @param pageable Pagination parameters
     * @return Page of matching product summary views
     */
    public Page<ProductSummaryView> searchProducts(String search, Pageable pageable) {
        String searchTerm = (search == null || search.isBlank()) ? null : search.trim();
        List<ProductSummaryView> content = productMapper.findWithFilters(
                null, searchTerm, pageable.getPageSize(), pageable.getOffset());
        long total = productMapper.countWithFilters(null, searchTerm);
        return new PageImpl<>(content, pageable, total);
    }

    /**
     * Find products by product type.
     *
     * @param productTypeId The product type ID
     * @param pageable      Pagination parameters
     * @return Page of product summary views
     */
    public Page<ProductSummaryView> findByProductType(Long productTypeId, Pageable pageable) {
        List<ProductSummaryView> content = productMapper.findWithFilters(
                productTypeId, null, pageable.getPageSize(), pageable.getOffset());
        long total = productMapper.countWithFilters(productTypeId, null);
        return new PageImpl<>(content, pageable, total);
    }

    /**
     * Search products by product type and search term.
     *
     * @param productTypeId Product type ID
     * @param search        Search term
     * @param pageable      Pagination parameters
     * @return Page of matching product summary views
     */
    public Page<ProductSummaryView> findByProductTypeAndSearch(Long productTypeId, String search, Pageable pageable) {
        String searchTerm = (search == null || search.isBlank()) ? null : search.trim();
        List<ProductSummaryView> content = productMapper.findWithFilters(
                productTypeId, searchTerm, pageable.getPageSize(), pageable.getOffset());
        long total = productMapper.countWithFilters(productTypeId, searchTerm);
        return new PageImpl<>(content, pageable, total);
    }

    /**
     * Check if a product exists and is active.
     *
     * @param productId The product ID
     * @return true if the product exists and is active
     */
    public boolean existsAndActive(Long productId) {
        return productMapper.existsByIdAndActiveTrue(productId);
    }

    // ========== PRODUCT TYPE QUERIES ==========

    /**
     * Get all product types.
     *
     * @return List of product type views
     */
    public List<ProductTypeView> getAllProductTypes() {
        return productMapper.findAllProductTypes();
    }

    /**
     * Get product type by ID.
     *
     * @param productTypeId The product type ID
     * @return Product type view
     * @throws ResourceNotFoundException if product type not found
     */
    public ProductTypeView getProductType(Long productTypeId) {
        return productMapper.findProductTypeById(productTypeId)
                .orElseThrow(() -> new ResourceNotFoundException("ProductType", productTypeId));
    }
}
