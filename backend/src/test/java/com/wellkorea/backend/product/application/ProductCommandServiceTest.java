package com.wellkorea.backend.product.application;

import com.wellkorea.backend.product.domain.Product;
import com.wellkorea.backend.product.domain.ProductType;
import com.wellkorea.backend.product.infrastructure.repository.ProductRepository;
import com.wellkorea.backend.product.infrastructure.repository.ProductTypeRepository;
import com.wellkorea.backend.shared.exception.BusinessException;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for ProductCommandService.
 * Tests validate product management business logic for write operations.
 * <p>
 * Test-First Development: These tests MUST be written FIRST and MUST FAIL initially.
 * Per Constitution Principle I (Test-First Development).
 */
@Tag("unit")
@ExtendWith(MockitoExtension.class)
@DisplayName("Product Command Service Unit Tests")
class ProductCommandServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductTypeRepository productTypeRepository;

    @InjectMocks
    private ProductCommandService productCommandService;

    // ==========================================================================
    // Create Product Tests
    // ==========================================================================

    @Nested
    @DisplayName("Create Product")
    class CreateProductTests {

        @Test
        @DisplayName("should create product and return ID")
        void createProduct_ValidData_ReturnsId() {
            // Given
            CreateProductCommand command = new CreateProductCommand(
                    "SKU-001",
                    "Test Product",
                    "Product description",
                    1L,
                    new BigDecimal("10000"),
                    "EA"
            );

            ProductType productType = createProductType(1L, "Electronics");
            Product savedProduct = createProduct(1L, "SKU-001", "Test Product", productType);

            when(productRepository.existsBySku("SKU-001")).thenReturn(false);
            when(productTypeRepository.findById(1L)).thenReturn(Optional.of(productType));
            when(productRepository.save(any(Product.class))).thenReturn(savedProduct);

            // When
            Long result = productCommandService.createProduct(command);

            // Then
            assertThat(result).isEqualTo(1L);
            verify(productRepository).save(any(Product.class));
        }

        @Test
        @DisplayName("should create product with null description")
        void createProduct_NullDescription_ReturnsId() {
            // Given
            CreateProductCommand command = new CreateProductCommand(
                    "SKU-002",
                    "Test Product",
                    null, // No description
                    1L,
                    new BigDecimal("5000"),
                    "SET"
            );

            ProductType productType = createProductType(1L, "Machinery");
            Product savedProduct = createProduct(2L, "SKU-002", "Test Product", productType);

            when(productRepository.existsBySku("SKU-002")).thenReturn(false);
            when(productTypeRepository.findById(1L)).thenReturn(Optional.of(productType));
            when(productRepository.save(any(Product.class))).thenReturn(savedProduct);

            // When
            Long result = productCommandService.createProduct(command);

            // Then
            assertThat(result).isEqualTo(2L);
        }

        @Test
        @DisplayName("should throw exception when SKU is duplicate")
        void createProduct_DuplicateSku_ThrowsException() {
            // Given
            CreateProductCommand command = new CreateProductCommand(
                    "EXISTING-SKU",
                    "Duplicate Product",
                    null,
                    1L,
                    new BigDecimal("10000"),
                    "EA"
            );

            when(productRepository.existsBySku("EXISTING-SKU")).thenReturn(true);

            // When & Then
            assertThatThrownBy(() -> productCommandService.createProduct(command))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("EXISTING-SKU")
                    .hasMessageContaining("already exists");
        }

        @Test
        @DisplayName("should throw exception when product type not found")
        void createProduct_ProductTypeNotFound_ThrowsException() {
            // Given
            CreateProductCommand command = new CreateProductCommand(
                    "SKU-003",
                    "Test Product",
                    null,
                    99999L, // Non-existent product type
                    new BigDecimal("10000"),
                    "EA"
            );

            when(productRepository.existsBySku("SKU-003")).thenReturn(false);
            when(productTypeRepository.findById(99999L)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> productCommandService.createProduct(command))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("ProductType");
        }

        @Test
        @DisplayName("should set product as active by default")
        void createProduct_SetsActiveTrue() {
            // Given
            CreateProductCommand command = new CreateProductCommand(
                    "SKU-004",
                    "Active Product",
                    null,
                    1L,
                    new BigDecimal("15000"),
                    "EA"
            );

            ProductType productType = createProductType(1L, "Electronics");
            Product savedProduct = createProduct(4L, "SKU-004", "Active Product", productType);
            savedProduct.setActive(true);

            when(productRepository.existsBySku("SKU-004")).thenReturn(false);
            when(productTypeRepository.findById(1L)).thenReturn(Optional.of(productType));
            when(productRepository.save(any(Product.class))).thenAnswer(invocation -> {
                Product product = invocation.getArgument(0);
                assertThat(product.isActive()).isTrue();
                product.setId(4L);
                return product;
            });

            // When
            Long result = productCommandService.createProduct(command);

            // Then
            assertThat(result).isEqualTo(4L);
        }
    }

    // ==========================================================================
    // Update Product Tests
    // ==========================================================================

    @Nested
    @DisplayName("Update Product")
    class UpdateProductTests {

        @Test
        @DisplayName("should update all product fields")
        void updateProduct_AllFields_ReturnsId() {
            // Given
            Long productId = 1L;
            ProductType oldType = createProductType(1L, "Old Type");
            ProductType newType = createProductType(2L, "New Type");
            Product existingProduct = createProduct(productId, "OLD-SKU", "Old Name", oldType);

            UpdateProductCommand command = new UpdateProductCommand(
                    "NEW-SKU",
                    "New Name",
                    "New Description",
                    2L,
                    new BigDecimal("25000"),
                    "SET",
                    true
            );

            when(productRepository.findById(productId)).thenReturn(Optional.of(existingProduct));
            when(productRepository.existsBySkuAndIdNot("NEW-SKU", productId)).thenReturn(false);
            when(productTypeRepository.findById(2L)).thenReturn(Optional.of(newType));
            when(productRepository.save(any(Product.class))).thenReturn(existingProduct);

            // When
            Long result = productCommandService.updateProduct(productId, command);

            // Then
            assertThat(result).isEqualTo(productId);
            verify(productRepository).save(any(Product.class));
        }

        @Test
        @DisplayName("should update only provided fields (partial update)")
        void updateProduct_PartialUpdate_OnlyUpdatesProvidedFields() {
            // Given
            Long productId = 1L;
            ProductType productType = createProductType(1L, "Type");
            Product existingProduct = createProduct(productId, "EXISTING-SKU", "Existing Name", productType);
            existingProduct.setBaseUnitPrice(new BigDecimal("10000"));

            // Only update name, leave other fields null
            UpdateProductCommand command = new UpdateProductCommand(
                    null, // Keep existing SKU
                    "Updated Name",
                    null, // Keep existing description
                    null, // Keep existing product type
                    null, // Keep existing price
                    null, // Keep existing unit
                    null  // Keep existing active status
            );

            when(productRepository.findById(productId)).thenReturn(Optional.of(existingProduct));
            when(productRepository.save(any(Product.class))).thenAnswer(invocation -> {
                Product product = invocation.getArgument(0);
                assertThat(product.getName()).isEqualTo("Updated Name");
                assertThat(product.getSku()).isEqualTo("EXISTING-SKU"); // Not changed
                return product;
            });

            // When
            Long result = productCommandService.updateProduct(productId, command);

            // Then
            assertThat(result).isEqualTo(productId);
            verify(productTypeRepository, never()).findById(anyLong()); // Not called since null
        }

        @Test
        @DisplayName("should throw exception when updating to duplicate SKU")
        void updateProduct_DuplicateSku_ThrowsException() {
            // Given
            Long productId = 1L;
            ProductType productType = createProductType(1L, "Type");
            Product existingProduct = createProduct(productId, "ORIGINAL-SKU", "Product", productType);

            UpdateProductCommand command = new UpdateProductCommand(
                    "EXISTING-SKU", // Another product's SKU
                    null, null, null, null, null, null
            );

            when(productRepository.findById(productId)).thenReturn(Optional.of(existingProduct));
            when(productRepository.existsBySkuAndIdNot("EXISTING-SKU", productId)).thenReturn(true);

            // When & Then
            assertThatThrownBy(() -> productCommandService.updateProduct(productId, command))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("EXISTING-SKU")
                    .hasMessageContaining("already exists");
        }

        @Test
        @DisplayName("should allow updating to same SKU (no change)")
        void updateProduct_SameSku_Succeeds() {
            // Given
            Long productId = 1L;
            ProductType productType = createProductType(1L, "Type");
            Product existingProduct = createProduct(productId, "SAME-SKU", "Product", productType);

            UpdateProductCommand command = new UpdateProductCommand(
                    "SAME-SKU", // Same SKU as existing
                    "Updated Name",
                    null, null, null, null, null
            );

            when(productRepository.findById(productId)).thenReturn(Optional.of(existingProduct));
            // existsBySkuAndIdNot should NOT be called since SKU is the same
            when(productRepository.save(any(Product.class))).thenReturn(existingProduct);

            // When
            Long result = productCommandService.updateProduct(productId, command);

            // Then
            assertThat(result).isEqualTo(productId);
            verify(productRepository, never()).existsBySkuAndIdNot(anyString(), anyLong());
        }

        @Test
        @DisplayName("should throw exception when product not found")
        void updateProduct_ProductNotFound_ThrowsException() {
            // Given
            Long productId = 99999L;
            UpdateProductCommand command = new UpdateProductCommand(
                    null, "New Name", null, null, null, null, null
            );

            when(productRepository.findById(productId)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> productCommandService.updateProduct(productId, command))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Product");
        }

        @Test
        @DisplayName("should throw exception when new product type not found")
        void updateProduct_ProductTypeNotFound_ThrowsException() {
            // Given
            Long productId = 1L;
            ProductType productType = createProductType(1L, "Old Type");
            Product existingProduct = createProduct(productId, "SKU", "Product", productType);

            UpdateProductCommand command = new UpdateProductCommand(
                    null, null, null,
                    99999L, // Non-existent product type
                    null, null, null
            );

            when(productRepository.findById(productId)).thenReturn(Optional.of(existingProduct));
            when(productTypeRepository.findById(99999L)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> productCommandService.updateProduct(productId, command))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("ProductType");
        }

        @Test
        @DisplayName("should update active status")
        void updateProduct_UpdateActiveStatus_Succeeds() {
            // Given
            Long productId = 1L;
            ProductType productType = createProductType(1L, "Type");
            Product existingProduct = createProduct(productId, "SKU", "Product", productType);
            existingProduct.setActive(true);

            UpdateProductCommand command = new UpdateProductCommand(
                    null, null, null, null, null, null,
                    false // Deactivate
            );

            when(productRepository.findById(productId)).thenReturn(Optional.of(existingProduct));
            when(productRepository.save(any(Product.class))).thenAnswer(invocation -> {
                Product product = invocation.getArgument(0);
                assertThat(product.isActive()).isFalse();
                return product;
            });

            // When
            Long result = productCommandService.updateProduct(productId, command);

            // Then
            assertThat(result).isEqualTo(productId);
        }
    }

    // ==========================================================================
    // Deactivate Product Tests
    // ==========================================================================

    @Nested
    @DisplayName("Deactivate Product")
    class DeactivateProductTests {

        @Test
        @DisplayName("should deactivate active product")
        void deactivateProduct_ActiveProduct_SetsInactive() {
            // Given
            Long productId = 1L;
            ProductType productType = createProductType(1L, "Type");
            Product activeProduct = createProduct(productId, "SKU", "Product", productType);
            activeProduct.setActive(true);

            when(productRepository.findById(productId)).thenReturn(Optional.of(activeProduct));
            when(productRepository.save(any(Product.class))).thenAnswer(invocation -> {
                Product product = invocation.getArgument(0);
                assertThat(product.isActive()).isFalse();
                return product;
            });

            // When
            productCommandService.deactivateProduct(productId);

            // Then
            verify(productRepository).save(any(Product.class));
        }

        @Test
        @DisplayName("should throw exception when product not found")
        void deactivateProduct_ProductNotFound_ThrowsException() {
            // Given
            Long productId = 99999L;

            when(productRepository.findById(productId)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> productCommandService.deactivateProduct(productId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Product");
        }

        @Test
        @DisplayName("should throw exception when product already inactive")
        void deactivateProduct_AlreadyInactive_ThrowsException() {
            // Given
            Long productId = 1L;
            ProductType productType = createProductType(1L, "Type");
            Product inactiveProduct = createProduct(productId, "SKU", "Product", productType);
            inactiveProduct.setActive(false);

            when(productRepository.findById(productId)).thenReturn(Optional.of(inactiveProduct));

            // When & Then
            assertThatThrownBy(() -> productCommandService.deactivateProduct(productId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Product");
        }
    }

    // ==========================================================================
    // Helper Methods
    // ==========================================================================

    private ProductType createProductType(Long id, String name) {
        ProductType productType = new ProductType();
        productType.setId(id);
        productType.setName(name);
        return productType;
    }

    private Product createProduct(Long id, String sku, String name, ProductType productType) {
        Product product = new Product();
        product.setId(id);
        product.setSku(sku);
        product.setName(name);
        product.setProductType(productType);
        product.setActive(true);
        return product;
    }
}
