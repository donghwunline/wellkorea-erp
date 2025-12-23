package com.wellkorea.backend.product.application;

import com.wellkorea.backend.product.api.dto.query.ProductDetailView;
import com.wellkorea.backend.product.api.dto.query.ProductSummaryView;
import com.wellkorea.backend.product.api.dto.query.ProductTypeView;
import com.wellkorea.backend.product.domain.Product;
import com.wellkorea.backend.product.domain.ProductType;
import com.wellkorea.backend.product.infrastructure.repository.ProductRepository;
import com.wellkorea.backend.product.infrastructure.repository.ProductTypeRepository;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Query service for product read operations.
 * Part of CQRS pattern - handles all read/query operations.
 * All methods are read-only and return view DTOs optimized for specific use cases.
 */
@Service
@Transactional(readOnly = true)
public class ProductQueryService {

    private final ProductRepository productRepository;
    private final ProductTypeRepository productTypeRepository;

    public ProductQueryService(ProductRepository productRepository, ProductTypeRepository productTypeRepository) {
        this.productRepository = productRepository;
        this.productTypeRepository = productTypeRepository;
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
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", productId));
        return ProductDetailView.from(product);
    }

    /**
     * List all active products (paginated).
     *
     * @param pageable Pagination parameters
     * @return Page of product summary views
     */
    public Page<ProductSummaryView> listProducts(Pageable pageable) {
        Page<Product> products = productRepository.findByActiveTrue(pageable);
        return products.map(ProductSummaryView::from);
    }

    /**
     * Search products by name or SKU.
     *
     * @param search   Search term
     * @param pageable Pagination parameters
     * @return Page of matching product summary views
     */
    public Page<ProductSummaryView> searchProducts(String search, Pageable pageable) {
        if (search == null || search.isBlank()) {
            return listProducts(pageable);
        }
        Page<Product> products = productRepository.searchProducts(search, pageable);
        return products.map(ProductSummaryView::from);
    }

    /**
     * Find products by product type.
     *
     * @param productTypeId The product type ID
     * @param pageable      Pagination parameters
     * @return Page of product summary views
     */
    public Page<ProductSummaryView> findByProductType(Long productTypeId, Pageable pageable) {
        Page<Product> products = productRepository.findByProductTypeIdAndActive(productTypeId, pageable);
        return products.map(ProductSummaryView::from);
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
        if (search == null || search.isBlank()) {
            return findByProductType(productTypeId, pageable);
        }
        Page<Product> products = productRepository.findByProductTypeIdAndSearch(productTypeId, search, pageable);
        return products.map(ProductSummaryView::from);
    }

    /**
     * Check if a product exists and is active.
     *
     * @param productId The product ID
     * @return true if the product exists and is active
     */
    public boolean existsAndActive(Long productId) {
        return productRepository.findById(productId)
                .map(Product::isActive)
                .orElse(false);
    }

    // ========== PRODUCT TYPE QUERIES ==========

    /**
     * Get all product types.
     *
     * @return List of product type views
     */
    public List<ProductTypeView> getAllProductTypes() {
        List<ProductType> productTypes = productTypeRepository.findAll();
        return productTypes.stream()
                .map(ProductTypeView::from)
                .toList();
    }

    /**
     * Get product type by ID.
     *
     * @param productTypeId The product type ID
     * @return Product type view
     * @throws ResourceNotFoundException if product type not found
     */
    public ProductTypeView getProductType(Long productTypeId) {
        ProductType productType = productTypeRepository.findById(productTypeId)
                .orElseThrow(() -> new ResourceNotFoundException("ProductType", productTypeId));
        return ProductTypeView.from(productType);
    }
}
