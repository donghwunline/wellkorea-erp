package com.wellkorea.backend.core.catalog.application;

import com.wellkorea.backend.core.catalog.api.dto.query.MaterialDetailView;
import com.wellkorea.backend.core.catalog.api.dto.query.MaterialSummaryView;
import com.wellkorea.backend.core.catalog.api.dto.query.VendorMaterialOfferingView;
import com.wellkorea.backend.core.catalog.infrastructure.mapper.MaterialMapper;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.verify;

/**
 * Unit tests for MaterialQueryService.
 * Tests read operations for material and vendor material offering queries.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("MaterialQueryService Unit Tests")
@Tag("unit")
class MaterialQueryServiceTest {

    @Mock
    private MaterialMapper materialMapper;

    @InjectMocks
    private MaterialQueryService queryService;

    private Pageable pageable;
    private MaterialDetailView testDetailView;
    private MaterialSummaryView testSummaryView;
    private VendorMaterialOfferingView testOfferingView;

    @BeforeEach
    void setUp() {
        pageable = PageRequest.of(0, 10);

        testDetailView = new MaterialDetailView(
                1L,
                "MAT-001",
                "Stainless Steel Bolt M10",
                "High-grade stainless steel bolt",
                1L,
                "Fasteners",
                "EA",
                new BigDecimal("500"),
                2L,
                "Premium Vendor Co",
                true,
                LocalDateTime.now(),
                LocalDateTime.now()
        );

        testSummaryView = new MaterialSummaryView(
                1L,
                "MAT-001",
                "Stainless Steel Bolt M10",
                "High-grade stainless steel bolt",
                1L,
                "Fasteners",
                "EA",
                new BigDecimal("500"),
                2L,
                "Premium Vendor Co",
                true,
                LocalDateTime.now(),
                LocalDateTime.now()
        );

        testOfferingView = new VendorMaterialOfferingView(
                1L,
                2L,
                "Premium Vendor Co",
                "vendor@test.com",
                1L,
                "Stainless Steel Bolt M10",
                "MAT-001",
                "VND-001",
                "Vendor Material Name",
                new BigDecimal("450"),
                "KRW",
                5,
                100,
                LocalDate.now().minusMonths(1),
                LocalDate.now().plusMonths(6),
                true,
                "High quality bolts",
                LocalDateTime.now(),
                LocalDateTime.now()
        );
    }

    // ========== MATERIAL QUERIES ==========

    @Nested
    @DisplayName("listMaterials - List materials with filters")
    class ListMaterialsTests {

        @Test
        @DisplayName("should return paginated results without filters")
        void listMaterials_WithPagination_ReturnsPage() {
            // Given
            List<MaterialSummaryView> content = List.of(testSummaryView);
            given(materialMapper.findWithFilters(null, null, true, 10, 0L)).willReturn(content);
            given(materialMapper.countWithFilters(null, null, true)).willReturn(1L);

            // When
            Page<MaterialSummaryView> result = queryService.listMaterials(null, null, true, pageable);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getTotalElements()).isEqualTo(1L);
            assertThat(result.getTotalPages()).isEqualTo(1);
        }

        @Test
        @DisplayName("should return empty page when no results")
        void listMaterials_NoResults_ReturnsEmptyPage() {
            // Given
            given(materialMapper.findWithFilters(null, null, true, 10, 0L)).willReturn(List.of());
            given(materialMapper.countWithFilters(null, null, true)).willReturn(0L);

            // When
            Page<MaterialSummaryView> result = queryService.listMaterials(null, null, true, pageable);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getContent()).isEmpty();
            assertThat(result.getTotalElements()).isEqualTo(0L);
        }

        @Test
        @DisplayName("should filter by categoryId")
        void listMaterials_WithCategoryId_ReturnsFilteredPage() {
            // Given
            Long categoryId = 1L;
            List<MaterialSummaryView> content = List.of(testSummaryView);
            given(materialMapper.findWithFilters(categoryId, null, true, 10, 0L)).willReturn(content);
            given(materialMapper.countWithFilters(categoryId, null, true)).willReturn(1L);

            // When
            Page<MaterialSummaryView> result = queryService.listMaterials(categoryId, null, true, pageable);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
            verify(materialMapper).findWithFilters(categoryId, null, true, 10, 0L);
        }

        @Test
        @DisplayName("should filter by search term")
        void listMaterials_WithSearchTerm_ReturnsFilteredPage() {
            // Given
            String search = "bolt";
            List<MaterialSummaryView> content = List.of(testSummaryView);
            given(materialMapper.findWithFilters(null, search, true, 10, 0L)).willReturn(content);
            given(materialMapper.countWithFilters(null, search, true)).willReturn(1L);

            // When
            Page<MaterialSummaryView> result = queryService.listMaterials(null, search, true, pageable);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
            verify(materialMapper).findWithFilters(null, search, true, 10, 0L);
        }

        @Test
        @DisplayName("should filter by activeOnly=false to include inactive")
        void listMaterials_ActiveOnlyFalse_ReturnsAllMaterials() {
            // Given
            MaterialSummaryView inactiveMaterial = new MaterialSummaryView(
                    2L, "MAT-002", "Inactive Material", null, 1L, "Category",
                    "EA", null, null, null, false,
                    LocalDateTime.now(), LocalDateTime.now()
            );
            List<MaterialSummaryView> content = List.of(testSummaryView, inactiveMaterial);
            given(materialMapper.findWithFilters(null, null, false, 10, 0L)).willReturn(content);
            given(materialMapper.countWithFilters(null, null, false)).willReturn(2L);

            // When
            Page<MaterialSummaryView> result = queryService.listMaterials(null, null, false, pageable);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(2);
            assertThat(result.getTotalElements()).isEqualTo(2L);
        }

        @Test
        @DisplayName("should combine all filters")
        void listMaterials_WithAllFilters_ReturnsCombinedFilter() {
            // Given
            Long categoryId = 1L;
            String search = "bolt";
            List<MaterialSummaryView> content = List.of(testSummaryView);
            given(materialMapper.findWithFilters(categoryId, search, true, 10, 0L)).willReturn(content);
            given(materialMapper.countWithFilters(categoryId, search, true)).willReturn(1L);

            // When
            Page<MaterialSummaryView> result = queryService.listMaterials(categoryId, search, true, pageable);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
            verify(materialMapper).findWithFilters(categoryId, search, true, 10, 0L);
        }
    }

    @Nested
    @DisplayName("getAllActiveMaterials - Get all active materials for dropdown")
    class GetAllActiveMaterialsTests {

        @Test
        @DisplayName("should return all active materials")
        void getAllActiveMaterials_ReturnsAllActive() {
            // Given
            List<MaterialSummaryView> materials = List.of(testSummaryView);
            given(materialMapper.findAllActive()).willReturn(materials);

            // When
            List<MaterialSummaryView> result = queryService.getAllActiveMaterials();

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).sku()).isEqualTo("MAT-001");
            verify(materialMapper).findAllActive();
        }

        @Test
        @DisplayName("should return empty list when no active materials")
        void getAllActiveMaterials_NoMaterials_ReturnsEmptyList() {
            // Given
            given(materialMapper.findAllActive()).willReturn(List.of());

            // When
            List<MaterialSummaryView> result = queryService.getAllActiveMaterials();

            // Then
            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("getMaterialDetail - Get material detail by ID")
    class GetMaterialDetailTests {

        @Test
        @DisplayName("should return detail view when material exists")
        void getMaterialDetail_MaterialExists_ReturnsDetailView() {
            // Given
            given(materialMapper.findById(1L)).willReturn(Optional.of(testDetailView));

            // When
            MaterialDetailView result = queryService.getMaterialDetail(1L);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.id()).isEqualTo(1L);
            assertThat(result.sku()).isEqualTo("MAT-001");
            assertThat(result.name()).isEqualTo("Stainless Steel Bolt M10");
            assertThat(result.categoryName()).isEqualTo("Fasteners");
            verify(materialMapper).findById(1L);
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException when material not found")
        void getMaterialDetail_MaterialNotFound_ThrowsException() {
            // Given
            given(materialMapper.findById(999L)).willReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> queryService.getMaterialDetail(999L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Material")
                    .hasMessageContaining("999");
        }
    }

    // ========== VENDOR MATERIAL OFFERING QUERIES ==========

    @Nested
    @DisplayName("getCurrentOfferingsForMaterial - Get current offerings by date")
    class GetCurrentOfferingsForMaterialTests {

        @Test
        @DisplayName("should filter by current date")
        void getCurrentOfferingsForMaterial_FiltersByDate() {
            // Given
            List<VendorMaterialOfferingView> offerings = List.of(testOfferingView);
            given(materialMapper.findCurrentOfferingsByMaterialId(eq(1L), any(LocalDate.class)))
                    .willReturn(offerings);

            // When
            List<VendorMaterialOfferingView> result = queryService.getCurrentOfferingsForMaterial(1L);

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).materialId()).isEqualTo(1L);
            verify(materialMapper).findCurrentOfferingsByMaterialId(eq(1L), eq(LocalDate.now()));
        }

        @Test
        @DisplayName("should return empty list when no current offerings")
        void getCurrentOfferingsForMaterial_NoCurrentOfferings_ReturnsEmptyList() {
            // Given
            given(materialMapper.findCurrentOfferingsByMaterialId(eq(1L), any(LocalDate.class)))
                    .willReturn(List.of());

            // When
            List<VendorMaterialOfferingView> result = queryService.getCurrentOfferingsForMaterial(1L);

            // Then
            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("getOfferingsForMaterial - Get offerings by material")
    class GetOfferingsForMaterialTests {

        @Test
        @DisplayName("should return paginated offerings")
        void getOfferingsForMaterial_ReturnsPage() {
            // Given
            List<VendorMaterialOfferingView> content = List.of(testOfferingView);
            given(materialMapper.findOfferingsByMaterialId(1L, 10, 0L)).willReturn(content);
            given(materialMapper.countOfferingsByMaterialId(1L)).willReturn(1L);

            // When
            Page<VendorMaterialOfferingView> result = queryService.getOfferingsForMaterial(1L, pageable);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getTotalElements()).isEqualTo(1L);
            verify(materialMapper).findOfferingsByMaterialId(1L, 10, 0L);
        }

        @Test
        @DisplayName("should return empty page when no offerings")
        void getOfferingsForMaterial_NoOfferings_ReturnsEmptyPage() {
            // Given
            given(materialMapper.findOfferingsByMaterialId(1L, 10, 0L)).willReturn(List.of());
            given(materialMapper.countOfferingsByMaterialId(1L)).willReturn(0L);

            // When
            Page<VendorMaterialOfferingView> result = queryService.getOfferingsForMaterial(1L, pageable);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getContent()).isEmpty();
            assertThat(result.getTotalElements()).isEqualTo(0L);
        }
    }

    @Nested
    @DisplayName("getOfferingById - Get vendor offering by ID")
    class GetOfferingByIdTests {

        @Test
        @DisplayName("should return offering when exists")
        void getOfferingById_OfferingExists_ReturnsOffering() {
            // Given
            given(materialMapper.findOfferingById(1L)).willReturn(Optional.of(testOfferingView));

            // When
            VendorMaterialOfferingView result = queryService.getOfferingById(1L);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.id()).isEqualTo(1L);
            assertThat(result.vendorName()).isEqualTo("Premium Vendor Co");
            assertThat(result.isPreferred()).isTrue();
            verify(materialMapper).findOfferingById(1L);
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException when not found")
        void getOfferingById_OfferingNotFound_ThrowsException() {
            // Given
            given(materialMapper.findOfferingById(999L)).willReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> queryService.getOfferingById(999L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Vendor material offering")
                    .hasMessageContaining("999");
        }
    }
}
