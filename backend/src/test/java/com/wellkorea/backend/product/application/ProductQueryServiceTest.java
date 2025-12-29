package com.wellkorea.backend.product.application;

import com.wellkorea.backend.product.api.dto.query.ProductDetailView;
import com.wellkorea.backend.product.api.dto.query.ProductSummaryView;
import com.wellkorea.backend.product.api.dto.query.ProductTypeView;
import com.wellkorea.backend.product.infrastructure.mapper.ProductMapper;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.BDDMockito.*;

/**
 * Unit tests for ProductQueryService.
 * Tests read operations for product queries with mocked MyBatis mapper.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ProductQueryService Unit Tests")
@Tag("unit")
class ProductQueryServiceTest {

    @Mock
    private ProductMapper productMapper;

    @InjectMocks
    private ProductQueryService queryService;

    private Pageable pageable;
    private ProductDetailView testDetailView;
    private ProductSummaryView testSummaryView;
    private ProductTypeView testProductTypeView;

    @BeforeEach
    void setUp() {
        pageable = PageRequest.of(0, 10);

        testDetailView = new ProductDetailView(
                1L,
                "SM-PANEL-001",
                "Control Panel",
                "Industrial control panel for automation",
                1L,
                "Sheet Metal",
                BigDecimal.valueOf(50000.00),
                "EA",
                true,
                LocalDateTime.now(),
                LocalDateTime.now()
        );

        // ProductSummaryView: (Long id, String sku, String name, String description,
        //                      Long productTypeId, String productTypeName,
        //                      BigDecimal baseUnitPrice, String unit, boolean isActive)
        testSummaryView = new ProductSummaryView(
                1L,
                "SM-PANEL-001",
                "Control Panel",
                "Industrial control panel for automation",
                1L,
                "Sheet Metal",
                BigDecimal.valueOf(50000.00),
                "EA",
                true
        );

        // ProductTypeView: (Long id, String name, String description, LocalDateTime createdAt)
        testProductTypeView = new ProductTypeView(
                1L,
                "Sheet Metal",
                "Sheet metal products",
                LocalDateTime.now()
        );
    }

    // ========== PRODUCT QUERIES ==========

    @Nested
    @DisplayName("getProductDetail - Get product detail by ID")
    class GetProductDetailTests {

        @Test
        @DisplayName("should return detail view when product exists")
        void getProductDetail_ProductExists_ReturnsDetailView() {
            // Given
            given(productMapper.findDetailById(1L)).willReturn(Optional.of(testDetailView));

            // When
            ProductDetailView result = queryService.getProductDetail(1L);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.id()).isEqualTo(1L);
            assertThat(result.sku()).isEqualTo("SM-PANEL-001");
            assertThat(result.name()).isEqualTo("Control Panel");
            assertThat(result.productTypeName()).isEqualTo("Sheet Metal");
            verify(productMapper).findDetailById(1L);
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException when product not found")
        void getProductDetail_ProductNotFound_ThrowsException() {
            // Given
            given(productMapper.findDetailById(999L)).willReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> queryService.getProductDetail(999L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Product")
                    .hasMessageContaining("999");
        }
    }

    @Nested
    @DisplayName("listProducts - List all products")
    class ListProductsTests {

        @Test
        @DisplayName("should return paginated results")
        void listProducts_WithPagination_ReturnsPage() {
            // Given
            List<ProductSummaryView> content = List.of(testSummaryView);
            given(productMapper.findWithFilters(null, null, 10, 0L)).willReturn(content);
            given(productMapper.countWithFilters(null, null)).willReturn(1L);

            // When
            Page<ProductSummaryView> result = queryService.listProducts(pageable);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getTotalElements()).isEqualTo(1L);
            assertThat(result.getTotalPages()).isEqualTo(1);
        }

        @Test
        @DisplayName("should return empty page when no results")
        void listProducts_NoResults_ReturnsEmptyPage() {
            // Given
            given(productMapper.findWithFilters(null, null, 10, 0L)).willReturn(List.of());
            given(productMapper.countWithFilters(null, null)).willReturn(0L);

            // When
            Page<ProductSummaryView> result = queryService.listProducts(pageable);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getContent()).isEmpty();
            assertThat(result.getTotalElements()).isEqualTo(0L);
        }
    }

    @Nested
    @DisplayName("searchProducts - Search products by name or SKU")
    class SearchProductsTests {

        @Test
        @DisplayName("should trim search term")
        void searchProducts_WithSearchTerm_ReturnsFilteredPage() {
            // Given
            List<ProductSummaryView> content = List.of(testSummaryView);
            given(productMapper.findWithFilters(null, "panel", 10, 0L)).willReturn(content);
            given(productMapper.countWithFilters(null, "panel")).willReturn(1L);

            // When
            Page<ProductSummaryView> result = queryService.searchProducts("  panel  ", pageable);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
            verify(productMapper).findWithFilters(null, "panel", 10, 0L);
        }

        @Test
        @DisplayName("should handle null search term")
        void searchProducts_NullSearchTerm_PassesNullToMapper() {
            // Given
            given(productMapper.findWithFilters(null, null, 10, 0L)).willReturn(List.of());
            given(productMapper.countWithFilters(null, null)).willReturn(0L);

            // When
            Page<ProductSummaryView> result = queryService.searchProducts(null, pageable);

            // Then
            assertThat(result).isEmpty();
            verify(productMapper).findWithFilters(null, null, 10, 0L);
        }

        @Test
        @DisplayName("should handle blank search term")
        void searchProducts_BlankSearchTerm_PassesNullToMapper() {
            // Given
            given(productMapper.findWithFilters(null, null, 10, 0L)).willReturn(List.of());
            given(productMapper.countWithFilters(null, null)).willReturn(0L);

            // When
            Page<ProductSummaryView> result = queryService.searchProducts("   ", pageable);

            // Then
            assertThat(result).isEmpty();
            verify(productMapper).findWithFilters(null, null, 10, 0L);
        }
    }

    @Nested
    @DisplayName("findByProductType - Filter products by product type")
    class FindByProductTypeTests {

        @Test
        @DisplayName("should filter by product type")
        void findByProductType_WithTypeId_ReturnsFilteredPage() {
            // Given
            List<ProductSummaryView> content = List.of(testSummaryView);
            given(productMapper.findWithFilters(1L, null, 10, 0L)).willReturn(content);
            given(productMapper.countWithFilters(1L, null)).willReturn(1L);

            // When
            Page<ProductSummaryView> result = queryService.findByProductType(1L, pageable);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
            verify(productMapper).findWithFilters(1L, null, 10, 0L);
        }
    }

    @Nested
    @DisplayName("findByProductTypeAndSearch - Filter by type with search")
    class FindByProductTypeAndSearchTests {

        @Test
        @DisplayName("should apply both filters")
        void findByProductTypeAndSearch_WithBothFilters_ReturnsFilteredPage() {
            // Given
            List<ProductSummaryView> content = List.of(testSummaryView);
            given(productMapper.findWithFilters(1L, "panel", 10, 0L)).willReturn(content);
            given(productMapper.countWithFilters(1L, "panel")).willReturn(1L);

            // When
            Page<ProductSummaryView> result = queryService.findByProductTypeAndSearch(
                    1L, "  panel  ", pageable);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
            verify(productMapper).findWithFilters(1L, "panel", 10, 0L);
        }

        @Test
        @DisplayName("should handle blank search with product type")
        void findByProductTypeAndSearch_BlankSearch_PassesNullSearch() {
            // Given
            List<ProductSummaryView> content = List.of(testSummaryView);
            given(productMapper.findWithFilters(1L, null, 10, 0L)).willReturn(content);
            given(productMapper.countWithFilters(1L, null)).willReturn(1L);

            // When
            Page<ProductSummaryView> result = queryService.findByProductTypeAndSearch(
                    1L, "   ", pageable);

            // Then
            assertThat(result).isNotNull();
            verify(productMapper).findWithFilters(1L, null, 10, 0L);
        }
    }

    @Nested
    @DisplayName("existsAndActive - Check if product exists and is active")
    class ExistsAndActiveTests {

        @Test
        @DisplayName("should return true when product is active")
        void existsAndActive_ProductActive_ReturnsTrue() {
            // Given
            given(productMapper.existsByIdAndActiveTrue(1L)).willReturn(true);

            // When
            boolean result = queryService.existsAndActive(1L);

            // Then
            assertThat(result).isTrue();
            verify(productMapper).existsByIdAndActiveTrue(1L);
        }

        @Test
        @DisplayName("should return false when product not found or inactive")
        void existsAndActive_ProductNotFoundOrInactive_ReturnsFalse() {
            // Given
            given(productMapper.existsByIdAndActiveTrue(999L)).willReturn(false);

            // When
            boolean result = queryService.existsAndActive(999L);

            // Then
            assertThat(result).isFalse();
        }
    }

    // ========== PRODUCT TYPE QUERIES ==========

    @Nested
    @DisplayName("getAllProductTypes - Get all product types")
    class GetAllProductTypesTests {

        @Test
        @DisplayName("should return all product types")
        void getAllProductTypes_ReturnsAllTypes() {
            // Given
            List<ProductTypeView> types = List.of(testProductTypeView);
            given(productMapper.findAllProductTypes()).willReturn(types);

            // When
            List<ProductTypeView> result = queryService.getAllProductTypes();

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).name()).isEqualTo("Sheet Metal");
            verify(productMapper).findAllProductTypes();
        }

        @Test
        @DisplayName("should return empty list when no types exist")
        void getAllProductTypes_NoTypes_ReturnsEmptyList() {
            // Given
            given(productMapper.findAllProductTypes()).willReturn(List.of());

            // When
            List<ProductTypeView> result = queryService.getAllProductTypes();

            // Then
            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("getProductType - Get product type by ID")
    class GetProductTypeTests {

        @Test
        @DisplayName("should return product type when exists")
        void getProductType_TypeExists_ReturnsType() {
            // Given
            given(productMapper.findProductTypeById(1L)).willReturn(Optional.of(testProductTypeView));

            // When
            ProductTypeView result = queryService.getProductType(1L);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.id()).isEqualTo(1L);
            assertThat(result.name()).isEqualTo("Sheet Metal");
            verify(productMapper).findProductTypeById(1L);
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException when not found")
        void getProductType_TypeNotFound_ThrowsException() {
            // Given
            given(productMapper.findProductTypeById(999L)).willReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> queryService.getProductType(999L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("ProductType")
                    .hasMessageContaining("999");
        }
    }
}
