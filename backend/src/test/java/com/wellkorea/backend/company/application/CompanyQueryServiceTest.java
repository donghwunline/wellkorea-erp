package com.wellkorea.backend.company.application;

import com.wellkorea.backend.company.api.dto.query.CompanyDetailView;
import com.wellkorea.backend.company.api.dto.query.CompanyRoleView;
import com.wellkorea.backend.company.api.dto.query.CompanySummaryView;
import com.wellkorea.backend.company.domain.vo.RoleType;
import com.wellkorea.backend.company.infrastructure.mapper.CompanyMapper;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.verify;

/**
 * Unit tests for CompanyQueryService.
 * Tests read operations for company queries with mocked MyBatis mapper.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("CompanyQueryService Unit Tests")
@Tag("unit")
class CompanyQueryServiceTest {

    @Mock
    private CompanyMapper companyMapper;

    @InjectMocks
    private CompanyQueryService queryService;

    private Pageable pageable;
    private CompanyDetailView testDetailView;
    private CompanySummaryView testSummaryView;
    private CompanyRoleView testRoleView;

    @BeforeEach
    void setUp() {
        pageable = PageRequest.of(0, 10);

        // CompanyRoleView: (RoleType roleType, Instant createdAt)
        testRoleView = new CompanyRoleView(
                RoleType.CUSTOMER,
                Instant.now()
        );
        List<CompanyRoleView> roles = List.of(testRoleView);

        // CompanyDetailView: (Long id, String name, String registrationNumber, String representative,
        //                     String businessType, String businessCategory, String contactPerson,
        //                     String phone, String email, String address, String bankAccount,
        //                     String paymentTerms, boolean isActive, Instant createdAt,
        //                     Instant updatedAt, List<CompanyRoleView> roles)
        testDetailView = new CompanyDetailView(
                1L,
                "ACME Corporation",
                "123-45-67890",
                "John Doe",
                "Manufacturing",
                "Electronics",
                "Jane Contact",
                "02-1234-5678",
                "contact@acme.com",
                "123 Main Street, Seoul",
                "Shinhan Bank 110-123-456789",
                "Net 30",
                true,
                Instant.now(),
                Instant.now(),
                roles
        );

        // CompanySummaryView: (Long id, String name, String registrationNumber,
        //                      String contactPerson, String phone, String email,
        //                      List<CompanyRoleView> roles)
        testSummaryView = new CompanySummaryView(
                1L,
                "ACME Corporation",
                "123-45-67890",
                "Jane Contact",
                "02-1234-5678",
                "contact@acme.com",
                roles
        );
    }

    @Nested
    @DisplayName("getCompanyDetail - Get company detail by ID")
    class GetCompanyDetailTests {

        @Test
        @DisplayName("should return detail view with roles when company exists")
        void getCompanyDetail_CompanyExists_ReturnsDetailView() {
            // Given
            given(companyMapper.findDetailById(1L)).willReturn(Optional.of(testDetailView));

            // When
            CompanyDetailView result = queryService.getCompanyDetail(1L);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.id()).isEqualTo(1L);
            assertThat(result.name()).isEqualTo("ACME Corporation");
            assertThat(result.registrationNumber()).isEqualTo("123-45-67890");
            assertThat(result.roles()).hasSize(1);
            assertThat(result.roles().get(0).roleType()).isEqualTo(RoleType.CUSTOMER);
            verify(companyMapper).findDetailById(1L);
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException when company not found")
        void getCompanyDetail_CompanyNotFound_ThrowsException() {
            // Given
            given(companyMapper.findDetailById(999L)).willReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> queryService.getCompanyDetail(999L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Company")
                    .hasMessageContaining("999");
        }
    }

    @Nested
    @DisplayName("listCompanies - List all companies")
    class ListCompaniesTests {

        @Test
        @DisplayName("should return paginated results with roles via JOIN")
        void listCompanies_WithPagination_ReturnsPage() {
            // Given - single JOIN query returns summaries with roles
            List<CompanySummaryView> summaries = List.of(testSummaryView);
            given(companyMapper.findWithFilters(null, null, 10, 0L)).willReturn(summaries);
            given(companyMapper.countWithFilters(null, null)).willReturn(1L);

            // When
            Page<CompanySummaryView> result = queryService.listCompanies(pageable);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).roles()).hasSize(1);
            assertThat(result.getTotalElements()).isEqualTo(1L);
            assertThat(result.getTotalPages()).isEqualTo(1);
            verify(companyMapper).findWithFilters(null, null, 10, 0L);
        }

        @Test
        @DisplayName("should return empty page when no results")
        void listCompanies_NoResults_ReturnsEmptyPage() {
            // Given
            given(companyMapper.findWithFilters(null, null, 10, 0L)).willReturn(List.of());
            given(companyMapper.countWithFilters(null, null)).willReturn(0L);

            // When
            Page<CompanySummaryView> result = queryService.listCompanies(pageable);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getContent()).isEmpty();
            assertThat(result.getTotalElements()).isEqualTo(0L);
        }
    }

    @Nested
    @DisplayName("findBySearch - Search companies by name")
    class FindBySearchTests {

        @Test
        @DisplayName("should trim search term and return filtered results")
        void findBySearch_WithSearchTerm_ReturnsFilteredPage() {
            // Given
            List<CompanySummaryView> summaries = List.of(testSummaryView);
            given(companyMapper.findWithFilters(null, "acme", 10, 0L)).willReturn(summaries);
            given(companyMapper.countWithFilters(null, "acme")).willReturn(1L);

            // When
            Page<CompanySummaryView> result = queryService.findBySearch("  acme  ", pageable);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
            verify(companyMapper).findWithFilters(null, "acme", 10, 0L);
        }

        @Test
        @DisplayName("should handle null search term")
        void findBySearch_NullSearchTerm_PassesNullToMapper() {
            // Given
            given(companyMapper.findWithFilters(null, null, 10, 0L)).willReturn(List.of());
            given(companyMapper.countWithFilters(null, null)).willReturn(0L);

            // When
            Page<CompanySummaryView> result = queryService.findBySearch(null, pageable);

            // Then
            assertThat(result).isEmpty();
            verify(companyMapper).findWithFilters(null, null, 10, 0L);
        }

        @Test
        @DisplayName("should handle blank search term")
        void findBySearch_BlankSearchTerm_PassesNullToMapper() {
            // Given
            given(companyMapper.findWithFilters(null, null, 10, 0L)).willReturn(List.of());
            given(companyMapper.countWithFilters(null, null)).willReturn(0L);

            // When
            Page<CompanySummaryView> result = queryService.findBySearch("   ", pageable);

            // Then
            assertThat(result).isEmpty();
            verify(companyMapper).findWithFilters(null, null, 10, 0L);
        }
    }

    @Nested
    @DisplayName("findByRoleType - Filter companies by role type")
    class FindByRoleTypeTests {

        @Test
        @DisplayName("should filter by role type")
        void findByRoleType_WithRoleType_ReturnsFilteredPage() {
            // Given
            List<CompanySummaryView> summaries = List.of(testSummaryView);
            given(companyMapper.findWithFilters(RoleType.CUSTOMER, null, 10, 0L)).willReturn(summaries);
            given(companyMapper.countWithFilters(RoleType.CUSTOMER, null)).willReturn(1L);

            // When
            Page<CompanySummaryView> result = queryService.findByRoleType(RoleType.CUSTOMER, pageable);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
            verify(companyMapper).findWithFilters(RoleType.CUSTOMER, null, 10, 0L);
        }
    }

    @Nested
    @DisplayName("findByRoleTypeAndSearch - Filter by role type with search")
    class FindByRoleTypeAndSearchTests {

        @Test
        @DisplayName("should apply both filters")
        void findByRoleTypeAndSearch_WithBothFilters_ReturnsFilteredPage() {
            // Given
            List<CompanySummaryView> summaries = List.of(testSummaryView);
            given(companyMapper.findWithFilters(RoleType.VENDOR, "supplier", 10, 0L)).willReturn(summaries);
            given(companyMapper.countWithFilters(RoleType.VENDOR, "supplier")).willReturn(1L);

            // When
            Page<CompanySummaryView> result = queryService.findByRoleTypeAndSearch(
                    RoleType.VENDOR, "  supplier  ", pageable);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
            verify(companyMapper).findWithFilters(RoleType.VENDOR, "supplier", 10, 0L);
        }

        @Test
        @DisplayName("should handle blank search with role type")
        void findByRoleTypeAndSearch_BlankSearch_PassesNullSearch() {
            // Given
            List<CompanySummaryView> summaries = List.of(testSummaryView);
            given(companyMapper.findWithFilters(RoleType.CUSTOMER, null, 10, 0L)).willReturn(summaries);
            given(companyMapper.countWithFilters(RoleType.CUSTOMER, null)).willReturn(1L);

            // When
            Page<CompanySummaryView> result = queryService.findByRoleTypeAndSearch(
                    RoleType.CUSTOMER, "   ", pageable);

            // Then
            assertThat(result).isNotNull();
            verify(companyMapper).findWithFilters(RoleType.CUSTOMER, null, 10, 0L);
        }
    }

    @Nested
    @DisplayName("existsAndActive - Check if company exists and is active")
    class ExistsAndActiveTests {

        @Test
        @DisplayName("should return true when company exists and is active")
        void existsAndActive_CompanyActive_ReturnsTrue() {
            // Given
            given(companyMapper.existsByIdAndIsActiveTrue(1L)).willReturn(true);

            // When
            boolean result = queryService.existsAndActive(1L);

            // Then
            assertThat(result).isTrue();
            verify(companyMapper).existsByIdAndIsActiveTrue(1L);
        }

        @Test
        @DisplayName("should return false when company not found or inactive")
        void existsAndActive_CompanyNotFound_ReturnsFalse() {
            // Given
            given(companyMapper.existsByIdAndIsActiveTrue(999L)).willReturn(false);

            // When
            boolean result = queryService.existsAndActive(999L);

            // Then
            assertThat(result).isFalse();
        }
    }
}
