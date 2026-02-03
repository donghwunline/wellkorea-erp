package com.wellkorea.backend.core.catalog.application;

import com.wellkorea.backend.core.catalog.api.dto.query.MaterialCategorySummaryView;
import com.wellkorea.backend.core.catalog.infrastructure.mapper.MaterialCategoryMapper;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.verify;

/**
 * Unit tests for MaterialCategoryQueryService.
 * Tests read operations for material category queries.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("MaterialCategoryQueryService Unit Tests")
@Tag("unit")
class MaterialCategoryQueryServiceTest {

    @Mock
    private MaterialCategoryMapper categoryMapper;

    @InjectMocks
    private MaterialCategoryQueryService queryService;

    private Pageable pageable;
    private MaterialCategorySummaryView testSummaryView;

    @BeforeEach
    void setUp() {
        pageable = PageRequest.of(0, 10);

        testSummaryView = new MaterialCategorySummaryView(
                1L,
                "Fasteners",
                "Bolts, nuts, screws and other fasteners",
                true,
                15,
                LocalDateTime.now(),
                LocalDateTime.now()
        );
    }

    // ========== CATEGORY QUERIES ==========

    @Nested
    @DisplayName("listCategories - List categories with filters")
    class ListCategoriesTests {

        @Test
        @DisplayName("should return paginated results with search and activeOnly")
        void listCategories_WithFilters_ReturnsPage() {
            // Given
            List<MaterialCategorySummaryView> content = List.of(testSummaryView);
            given(categoryMapper.findWithFilters("fastener", true, 10, 0L)).willReturn(content);
            given(categoryMapper.countWithFilters("fastener", true)).willReturn(1L);

            // When
            Page<MaterialCategorySummaryView> result = queryService.listCategories("fastener", true, pageable);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getTotalElements()).isEqualTo(1L);
            assertThat(result.getTotalPages()).isEqualTo(1);
        }

        @Test
        @DisplayName("should return empty page when no results")
        void listCategories_NoResults_ReturnsEmptyPage() {
            // Given
            given(categoryMapper.findWithFilters(null, true, 10, 0L)).willReturn(List.of());
            given(categoryMapper.countWithFilters(null, true)).willReturn(0L);

            // When
            Page<MaterialCategorySummaryView> result = queryService.listCategories(null, true, pageable);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getContent()).isEmpty();
            assertThat(result.getTotalElements()).isEqualTo(0L);
        }

        @Test
        @DisplayName("should filter by activeOnly=false to include inactive")
        void listCategories_IncludeInactive_ReturnsAllCategories() {
            // Given
            MaterialCategorySummaryView inactiveCategory = new MaterialCategorySummaryView(
                    2L, "Inactive Category", "Description", false, 0,
                    LocalDateTime.now(), LocalDateTime.now()
            );
            List<MaterialCategorySummaryView> content = List.of(testSummaryView, inactiveCategory);
            given(categoryMapper.findWithFilters(null, false, 10, 0L)).willReturn(content);
            given(categoryMapper.countWithFilters(null, false)).willReturn(2L);

            // When
            Page<MaterialCategorySummaryView> result = queryService.listCategories(null, false, pageable);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(2);
            assertThat(result.getTotalElements()).isEqualTo(2L);
        }
    }

    @Nested
    @DisplayName("listCategories(pageable) - Convenience method for active only")
    class ListCategoriesDefaultTests {

        @Test
        @DisplayName("should default to active only with no search")
        void listCategories_DefaultParams_ReturnsActiveOnly() {
            // Given
            List<MaterialCategorySummaryView> content = List.of(testSummaryView);
            given(categoryMapper.findWithFilters(null, true, 10, 0L)).willReturn(content);
            given(categoryMapper.countWithFilters(null, true)).willReturn(1L);

            // When
            Page<MaterialCategorySummaryView> result = queryService.listCategories(pageable);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
            verify(categoryMapper).findWithFilters(null, true, 10, 0L);
        }
    }

    @Nested
    @DisplayName("searchCategories - Search categories by name")
    class SearchCategoriesTests {

        @Test
        @DisplayName("should search with activeOnly=true")
        void searchCategories_SearchActive_ReturnsActiveMatches() {
            // Given
            List<MaterialCategorySummaryView> content = List.of(testSummaryView);
            given(categoryMapper.findWithFilters("fast", true, 10, 0L)).willReturn(content);
            given(categoryMapper.countWithFilters("fast", true)).willReturn(1L);

            // When
            Page<MaterialCategorySummaryView> result = queryService.searchCategories("fast", pageable);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
            verify(categoryMapper).findWithFilters("fast", true, 10, 0L);
        }

        @Test
        @DisplayName("should return empty page when no matches")
        void searchCategories_NoMatches_ReturnsEmptyPage() {
            // Given
            given(categoryMapper.findWithFilters("nonexistent", true, 10, 0L)).willReturn(List.of());
            given(categoryMapper.countWithFilters("nonexistent", true)).willReturn(0L);

            // When
            Page<MaterialCategorySummaryView> result = queryService.searchCategories("nonexistent", pageable);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getContent()).isEmpty();
        }
    }

    @Nested
    @DisplayName("getAllActiveCategories - Get all active categories for dropdown")
    class GetAllActiveCategoriesTests {

        @Test
        @DisplayName("should return all active categories")
        void getAllActiveCategories_ReturnsAllActive() {
            // Given
            MaterialCategorySummaryView secondCategory = new MaterialCategorySummaryView(
                    2L, "Raw Materials", "Iron, copper, aluminum", true, 8,
                    LocalDateTime.now(), LocalDateTime.now()
            );
            List<MaterialCategorySummaryView> categories = List.of(testSummaryView, secondCategory);
            given(categoryMapper.findAllActive()).willReturn(categories);

            // When
            List<MaterialCategorySummaryView> result = queryService.getAllActiveCategories();

            // Then
            assertThat(result).hasSize(2);
            assertThat(result.get(0).name()).isEqualTo("Fasteners");
            assertThat(result.get(1).name()).isEqualTo("Raw Materials");
            verify(categoryMapper).findAllActive();
        }

        @Test
        @DisplayName("should return empty list when no active categories")
        void getAllActiveCategories_NoCategories_ReturnsEmptyList() {
            // Given
            given(categoryMapper.findAllActive()).willReturn(List.of());

            // When
            List<MaterialCategorySummaryView> result = queryService.getAllActiveCategories();

            // Then
            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("getCategoryDetail - Get category by ID")
    class GetCategoryDetailTests {

        @Test
        @DisplayName("should return category when exists")
        void getCategoryDetail_CategoryExists_ReturnsCategory() {
            // Given
            given(categoryMapper.findById(1L)).willReturn(Optional.of(testSummaryView));

            // When
            MaterialCategorySummaryView result = queryService.getCategoryDetail(1L);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.id()).isEqualTo(1L);
            assertThat(result.name()).isEqualTo("Fasteners");
            assertThat(result.materialCount()).isEqualTo(15);
            verify(categoryMapper).findById(1L);
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException when category not found")
        void getCategoryDetail_CategoryNotFound_ThrowsException() {
            // Given
            given(categoryMapper.findById(999L)).willReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> queryService.getCategoryDetail(999L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Material category")
                    .hasMessageContaining("999");
        }
    }
}
