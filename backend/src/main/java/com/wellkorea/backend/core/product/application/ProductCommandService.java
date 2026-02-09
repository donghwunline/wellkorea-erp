package com.wellkorea.backend.core.product.application;

import com.wellkorea.backend.core.product.domain.Product;
import com.wellkorea.backend.core.product.domain.ProductType;
import com.wellkorea.backend.core.product.infrastructure.repository.ProductRepository;
import com.wellkorea.backend.core.product.infrastructure.repository.ProductTypeRepository;
import com.wellkorea.backend.shared.exception.BusinessException;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Command service for product write operations.
 * Part of CQRS pattern - handles all create/update/delete operations.
 * Returns only entity IDs - clients should fetch fresh data via ProductQueryService.
 */
@Service
@Transactional
public class ProductCommandService {

    private static final Logger log = LoggerFactory.getLogger(ProductCommandService.class);

    private final ProductRepository productRepository;
    private final ProductTypeRepository productTypeRepository;

    public ProductCommandService(ProductRepository productRepository, ProductTypeRepository productTypeRepository) {
        this.productRepository = productRepository;
        this.productTypeRepository = productTypeRepository;
    }

    /**
     * Create a new product.
     *
     * @param command The creation command
     * @return ID of the created product
     * @throws BusinessException         if SKU is duplicate
     * @throws ResourceNotFoundException if product type not found
     */
    public Long createProduct(CreateProductCommand command) {
        log.info("Creating product: sku={}", command.sku());

        // Validate unique SKU
        if (productRepository.existsBySku(command.sku())) {
            throw new BusinessException("Product with SKU '" + command.sku() + "' already exists");
        }

        // Validate product type exists
        ProductType productType = productTypeRepository.findById(command.productTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("ProductType", command.productTypeId()));

        // Create product
        Product product = new Product();
        product.setSku(command.sku());
        product.setName(command.name());
        product.setDescription(command.description());
        product.setProductType(productType);
        product.setBaseUnitPrice(command.baseUnitPrice());
        product.setUnit(command.unit());
        product.setActive(true);

        Long productId = productRepository.save(product).getId();
        log.info("Created product: id={}, sku={}", productId, command.sku());
        return productId;
    }

    /**
     * Update a product.
     *
     * @param productId The product ID
     * @param command   The update command
     * @return ID of the updated product
     * @throws ResourceNotFoundException if product or product type not found
     * @throws BusinessException         if new SKU is duplicate
     */
    public Long updateProduct(Long productId, UpdateProductCommand command) {
        log.info("Updating product id={}", productId);

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", productId));

        // Validate unique SKU if changing
        if (command.sku() != null && !command.sku().equals(product.getSku())) {
            if (productRepository.existsBySkuAndIdNot(command.sku(), productId)) {
                throw new BusinessException("Product with SKU '" + command.sku() + "' already exists");
            }
            product.setSku(command.sku());
        }

        // Update fields if provided
        if (command.name() != null) {
            product.setName(command.name());
        }
        if (command.description() != null) {
            product.setDescription(command.description());
        }
        if (command.productTypeId() != null) {
            ProductType productType = productTypeRepository.findById(command.productTypeId())
                    .orElseThrow(() -> new ResourceNotFoundException("ProductType", command.productTypeId()));
            product.setProductType(productType);
        }
        if (command.baseUnitPrice() != null) {
            product.setBaseUnitPrice(command.baseUnitPrice());
        }
        if (command.unit() != null) {
            product.setUnit(command.unit());
        }
        if (command.isActive() != null) {
            product.setActive(command.isActive());
        }

        return productRepository.save(product).getId();
    }

    /**
     * Deactivate (soft delete) a product.
     *
     * @param productId The product ID
     * @throws ResourceNotFoundException if product not found
     */
    public void deactivateProduct(Long productId) {
        log.info("Deactivating product id={}", productId);

        Product product = productRepository.findById(productId)
                .filter(Product::isActive)
                .orElseThrow(() -> new ResourceNotFoundException("Product", productId));

        product.setActive(false);
        productRepository.save(product);
    }
}
