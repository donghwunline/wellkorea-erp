package com.wellkorea.backend.catalog.application;

import com.wellkorea.backend.catalog.api.dto.query.ServiceCategoryDetailView;
import com.wellkorea.backend.catalog.api.dto.query.ServiceCategorySummaryView;
import com.wellkorea.backend.catalog.api.dto.query.VendorServiceOfferingView;
import com.wellkorea.backend.catalog.infrastructure.mapper.ServiceCategoryMapper;
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
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;

/**
 * Unit tests for ServiceCategoryQueryService.
 * Tests read operations for service category and vendor offering queries.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ServiceCategoryQueryService Unit Tests")
@Tag("unit")
class ServiceCategoryQueryServiceTest {

    @Mock
    private ServiceCategoryMapper serviceCategoryMapper;

    @InjectMocks
    private ServiceCategoryQueryService queryService;

    private Pageable pageable;
    private ServiceCategoryDetailView testDetailView;
    private ServiceCategorySummaryView testSummaryView;
    private VendorServiceOfferingView testOfferingView;

    @BeforeEach
    void setUp() {
        pageable = PageRequest.of(0, 10);

        testDetailView = new ServiceCategoryDetailView(
                1L,
                "Laser Cutting",
                "Precision laser cutting services",
                true,
                5,
                LocalDateTime.now(),
                LocalDateTime.now()
        );

        testSummaryView = new ServiceCategorySummaryView(
                1L,
                "Laser Cutting",
                "Precision laser cutting services",
                true,
                5
        );

        testOfferingView = new VendorServiceOfferingView(
                1L,
                1L,
                "Metal Works Inc",
                "vendor@test.com",
                1L,
                "Laser Cutting",
                "LC-001",
                "Standard Laser Cut",
                BigDecimal.valueOf(15000.00),
                "KRW",
                3,
                10,
                LocalDate.now().minusMonths(1),
                LocalDate.now().plusMonths(6),
                true,
                "High precision cutting",
                LocalDateTime.now(),
                LocalDateTime.now()
        );
    }

    // ========== SERVICE CATEGORY QUERIES ==========

    @Nested
    @DisplayName("getServiceCategoryDetail - Get service category detail by ID")
    class GetServiceCategoryDetailTests {

        @Test
        @DisplayName("should return detail view when category exists")
        void getServiceCategoryDetail_CategoryExists_ReturnsDetailView() {
            // Given
            given(serviceCategoryMapper.findDetailById(1L)).willReturn(Optional.of(testDetailView));

            // When
            ServiceCategoryDetailView result = queryService.getServiceCategoryDetail(1L);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.id()).isEqualTo(1L);
            assertThat(result.name()).isEqualTo("Laser Cutting");
            assertThat(result.vendorCount()).isEqualTo(5);
            verify(serviceCategoryMapper).findDetailById(1L);
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException when category not found")
        void getServiceCategoryDetail_CategoryNotFound_ThrowsException() {
            // Given
            given(serviceCategoryMapper.findDetailById(999L)).willReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> queryService.getServiceCategoryDetail(999L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("ServiceCategory")
                    .hasMessageContaining("999");
        }
    }

    @Nested
    @DisplayName("listServiceCategories - List service categories with filters")
    class ListServiceCategoriesTests {

        @Test
        @DisplayName("should return paginated results without filters")
        void listServiceCategories_WithPagination_ReturnsPage() {
            // Given
            List<ServiceCategorySummaryView> content = List.of(testSummaryView);
            given(serviceCategoryMapper.findWithFilters(null, null, 10, 0L)).willReturn(content);
            given(serviceCategoryMapper.countWithFilters(null, null)).willReturn(1L);

            // When
            Page<ServiceCategorySummaryView> result = queryService.listServiceCategories(null, null, pageable);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getTotalElements()).isEqualTo(1L);
            assertThat(result.getTotalPages()).isEqualTo(1);
        }

        @Test
        @DisplayName("should return empty page when no results")
        void listServiceCategories_NoResults_ReturnsEmptyPage() {
            // Given
            given(serviceCategoryMapper.findWithFilters(null, null, 10, 0L)).willReturn(List.of());
            given(serviceCategoryMapper.countWithFilters(null, null)).willReturn(0L);

            // When
            Page<ServiceCategorySummaryView> result = queryService.listServiceCategories(null, null, pageable);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getContent()).isEmpty();
            assertThat(result.getTotalElements()).isEqualTo(0L);
        }

        @Test
        @DisplayName("should trim search term")
        void listServiceCategories_WithSearchTerm_ReturnsFilteredPage() {
            // Given
            List<ServiceCategorySummaryView> content = List.of(testSummaryView);
            given(serviceCategoryMapper.findWithFilters("laser", null, 10, 0L)).willReturn(content);
            given(serviceCategoryMapper.countWithFilters("laser", null)).willReturn(1L);

            // When
            Page<ServiceCategorySummaryView> result = queryService.listServiceCategories("  laser  ", null, pageable);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
            verify(serviceCategoryMapper).findWithFilters("laser", null, 10, 0L);
        }

        @Test
        @DisplayName("should handle blank search term")
        void listServiceCategories_BlankSearchTerm_PassesNullToMapper() {
            // Given
            given(serviceCategoryMapper.findWithFilters(null, null, 10, 0L)).willReturn(List.of());
            given(serviceCategoryMapper.countWithFilters(null, null)).willReturn(0L);

            // When
            Page<ServiceCategorySummaryView> result = queryService.listServiceCategories("   ", null, pageable);

            // Then
            assertThat(result).isEmpty();
            verify(serviceCategoryMapper).findWithFilters(null, null, 10, 0L);
        }

        @Test
        @DisplayName("should filter by isActive=true")
        void listServiceCategories_ActiveOnly_ReturnsActiveCategories() {
            // Given
            List<ServiceCategorySummaryView> content = List.of(testSummaryView);
            given(serviceCategoryMapper.findWithFilters(null, true, 10, 0L)).willReturn(content);
            given(serviceCategoryMapper.countWithFilters(null, true)).willReturn(1L);

            // When
            Page<ServiceCategorySummaryView> result = queryService.listServiceCategories(null, true, pageable);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
            verify(serviceCategoryMapper).findWithFilters(null, true, 10, 0L);
        }

        @Test
        @DisplayName("should filter by isActive=false")
        void listServiceCategories_InactiveOnly_ReturnsInactiveCategories() {
            // Given
            ServiceCategorySummaryView inactiveView = new ServiceCategorySummaryView(
                    2L, "Inactive Category", "Description", false, 0);
            List<ServiceCategorySummaryView> content = List.of(inactiveView);
            given(serviceCategoryMapper.findWithFilters(null, false, 10, 0L)).willReturn(content);
            given(serviceCategoryMapper.countWithFilters(null, false)).willReturn(1L);

            // When
            Page<ServiceCategorySummaryView> result = queryService.listServiceCategories(null, false, pageable);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).isActive()).isFalse();
            verify(serviceCategoryMapper).findWithFilters(null, false, 10, 0L);
        }

        @Test
        @DisplayName("should combine search and isActive filters")
        void listServiceCategories_WithSearchAndIsActive_ReturnsCombinedFilter() {
            // Given
            List<ServiceCategorySummaryView> content = List.of(testSummaryView);
            given(serviceCategoryMapper.findWithFilters("laser", true, 10, 0L)).willReturn(content);
            given(serviceCategoryMapper.countWithFilters("laser", true)).willReturn(1L);

            // When
            Page<ServiceCategorySummaryView> result = queryService.listServiceCategories("laser", true, pageable);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
            verify(serviceCategoryMapper).findWithFilters("laser", true, 10, 0L);
        }
    }

    @Nested
    @DisplayName("getAllServiceCategories - Get all service categories for dropdown")
    class GetAllServiceCategoriesTests {

        @Test
        @DisplayName("should return all active categories")
        void getAllServiceCategories_ReturnsAllActive() {
            // Given
            List<ServiceCategorySummaryView> categories = List.of(testSummaryView);
            given(serviceCategoryMapper.findAllActive()).willReturn(categories);

            // When
            List<ServiceCategorySummaryView> result = queryService.getAllServiceCategories();

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).name()).isEqualTo("Laser Cutting");
            verify(serviceCategoryMapper).findAllActive();
        }

        @Test
        @DisplayName("should return empty list when no categories")
        void getAllServiceCategories_NoCategories_ReturnsEmptyList() {
            // Given
            given(serviceCategoryMapper.findAllActive()).willReturn(List.of());

            // When
            List<ServiceCategorySummaryView> result = queryService.getAllServiceCategories();

            // Then
            assertThat(result).isEmpty();
        }
    }

    // ========== VENDOR OFFERING QUERIES ==========

    @Nested
    @DisplayName("getOfferingsForServiceCategory - Get offerings by service category")
    class GetOfferingsForServiceCategoryTests {

        @Test
        @DisplayName("should return paginated offerings")
        void getOfferingsForServiceCategory_ReturnsPage() {
            // Given
            List<VendorServiceOfferingView> content = List.of(testOfferingView);
            given(serviceCategoryMapper.findOfferingsByServiceCategoryId(1L, 10, 0L)).willReturn(content);
            given(serviceCategoryMapper.countOfferingsByServiceCategoryId(1L)).willReturn(1L);

            // When
            Page<VendorServiceOfferingView> result = queryService.getOfferingsForServiceCategory(1L, pageable);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getTotalElements()).isEqualTo(1L);
            verify(serviceCategoryMapper).findOfferingsByServiceCategoryId(1L, 10, 0L);
        }
    }

    @Nested
    @DisplayName("getCurrentOfferingsForServiceCategory - Get current offerings by date")
    class GetCurrentOfferingsForServiceCategoryTests {

        @Test
        @DisplayName("should filter by current date")
        void getCurrentOfferingsForServiceCategory_FiltersByDate() {
            // Given
            List<VendorServiceOfferingView> offerings = List.of(testOfferingView);
            given(serviceCategoryMapper.findCurrentOfferingsByServiceCategoryId(eq(1L), any(LocalDate.class)))
                    .willReturn(offerings);

            // When
            List<VendorServiceOfferingView> result = queryService.getCurrentOfferingsForServiceCategory(1L);

            // Then
            assertThat(result).hasSize(1);
            verify(serviceCategoryMapper).findCurrentOfferingsByServiceCategoryId(eq(1L), eq(LocalDate.now()));
        }

        @Test
        @DisplayName("should return empty list when no current offerings")
        void getCurrentOfferingsForServiceCategory_NoCurrentOfferings_ReturnsEmptyList() {
            // Given
            given(serviceCategoryMapper.findCurrentOfferingsByServiceCategoryId(eq(1L), any(LocalDate.class)))
                    .willReturn(List.of());

            // When
            List<VendorServiceOfferingView> result = queryService.getCurrentOfferingsForServiceCategory(1L);

            // Then
            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("getOfferingsForVendor - Get offerings by vendor")
    class GetOfferingsForVendorTests {

        @Test
        @DisplayName("should return paginated offerings by vendor")
        void getOfferingsForVendor_ReturnsPage() {
            // Given
            List<VendorServiceOfferingView> content = List.of(testOfferingView);
            given(serviceCategoryMapper.findOfferingsByVendorId(1L, 10, 0L)).willReturn(content);
            given(serviceCategoryMapper.countOfferingsByVendorId(1L)).willReturn(1L);

            // When
            Page<VendorServiceOfferingView> result = queryService.getOfferingsForVendor(1L, pageable);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getTotalElements()).isEqualTo(1L);
            verify(serviceCategoryMapper).findOfferingsByVendorId(1L, 10, 0L);
        }
    }

    @Nested
    @DisplayName("getVendorOffering - Get vendor offering by ID")
    class GetVendorOfferingTests {

        @Test
        @DisplayName("should return offering when exists")
        void getVendorOffering_OfferingExists_ReturnsOffering() {
            // Given
            given(serviceCategoryMapper.findOfferingById(1L)).willReturn(Optional.of(testOfferingView));

            // When
            VendorServiceOfferingView result = queryService.getVendorOffering(1L);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.id()).isEqualTo(1L);
            assertThat(result.vendorName()).isEqualTo("Metal Works Inc");
            verify(serviceCategoryMapper).findOfferingById(1L);
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException when not found")
        void getVendorOffering_OfferingNotFound_ThrowsException() {
            // Given
            given(serviceCategoryMapper.findOfferingById(999L)).willReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> queryService.getVendorOffering(999L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("VendorServiceOffering")
                    .hasMessageContaining("999");
        }
    }
}
