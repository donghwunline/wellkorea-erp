package com.wellkorea.backend.quotation.application;

import com.wellkorea.backend.quotation.api.dto.query.LineItemView;
import com.wellkorea.backend.quotation.api.dto.query.QuotationDetailView;
import com.wellkorea.backend.quotation.api.dto.query.QuotationSummaryView;
import com.wellkorea.backend.quotation.domain.QuotationStatus;
import com.wellkorea.backend.quotation.infrastructure.mapper.QuotationMapper;
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
import static org.mockito.BDDMockito.*;

/**
 * Unit tests for QuotationQueryService.
 * Tests read operations for quotation queries with mocked MyBatis mapper.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("QuotationQueryService Unit Tests")
@Tag("unit")
class QuotationQueryServiceTest {

    @Mock
    private QuotationMapper quotationMapper;

    @InjectMocks
    private QuotationQueryService queryService;

    private Pageable pageable;
    private QuotationDetailView testDetailView;
    private QuotationSummaryView testSummaryView;

    @BeforeEach
    void setUp() {
        pageable = PageRequest.of(0, 10);

        // LineItemView: (Long id, Long productId, String productSku, String productName,
        //                String specification, String unit, Integer sequence, BigDecimal quantity,
        //                BigDecimal unitPrice, BigDecimal lineTotal, String notes)
        LineItemView testLineItem = new LineItemView(
                1L,
                1L,
                "SM-PANEL-001",
                "Control Panel",
                "Standard Panel",
                "EA",
                1,
                BigDecimal.TEN,
                BigDecimal.valueOf(50000.00),
                BigDecimal.valueOf(500000.00),
                "Test notes"
        );

        testDetailView = new QuotationDetailView(
                1L,
                1L,
                100L,
                "Test Project",
                "WK2K25-0001-1219",
                1,
                QuotationStatus.DRAFT,
                LocalDate.now(),
                30,
                LocalDate.now().plusDays(30),
                BigDecimal.valueOf(500000.00),
                "Test quotation notes",
                1L,
                "Admin User",
                null,
                null,
                null,
                null,
                null,
                LocalDateTime.now(),
                LocalDateTime.now(),
                List.of(testLineItem)
        );

        testSummaryView = new QuotationSummaryView(
                1L,
                1L,
                "Test Project",
                "WK2K25-0001-1219",
                1,
                QuotationStatus.DRAFT,
                LocalDate.now(),
                30,
                LocalDate.now().plusDays(30),
                BigDecimal.valueOf(500000.00),
                "Test quotation notes",
                1L,
                "Admin User",
                null,
                null,
                null,
                null,
                null,
                LocalDateTime.now(),
                LocalDateTime.now()
        );
    }

    @Nested
    @DisplayName("getQuotationDetail - Get quotation detail by ID")
    class GetQuotationDetailTests {

        @Test
        @DisplayName("should return detail view with line items when quotation exists")
        void getQuotationDetail_QuotationExists_ReturnsDetailView() {
            // Given
            given(quotationMapper.findDetailById(1L)).willReturn(Optional.of(testDetailView));

            // When
            QuotationDetailView result = queryService.getQuotationDetail(1L);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.id()).isEqualTo(1L);
            assertThat(result.projectName()).isEqualTo("Test Project");
            assertThat(result.jobCode()).isEqualTo("WK2K25-0001-1219");
            assertThat(result.status()).isEqualTo(QuotationStatus.DRAFT);
            assertThat(result.lineItems()).hasSize(1);
            assertThat(result.lineItems().get(0).productName()).isEqualTo("Control Panel");
            verify(quotationMapper).findDetailById(1L);
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException when quotation not found")
        void getQuotationDetail_QuotationNotFound_ThrowsException() {
            // Given
            given(quotationMapper.findDetailById(999L)).willReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> queryService.getQuotationDetail(999L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Quotation")
                    .hasMessageContaining("999");
        }
    }

    @Nested
    @DisplayName("listQuotations - List quotations with filters")
    class ListQuotationsTests {

        @Test
        @DisplayName("should filter by status and projectId")
        void listQuotations_WithFilters_ReturnsFilteredPage() {
            // Given
            List<QuotationSummaryView> content = List.of(testSummaryView);
            given(quotationMapper.findWithFilters(QuotationStatus.DRAFT, 1L, 10, 0L)).willReturn(content);
            given(quotationMapper.countWithFilters(QuotationStatus.DRAFT, 1L)).willReturn(1L);

            // When
            Page<QuotationSummaryView> result = queryService.listQuotations(QuotationStatus.DRAFT, 1L, pageable);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getTotalElements()).isEqualTo(1L);
            assertThat(result.getContent().get(0).status()).isEqualTo(QuotationStatus.DRAFT);
            verify(quotationMapper).findWithFilters(QuotationStatus.DRAFT, 1L, 10, 0L);
        }

        @Test
        @DisplayName("should return all when filters are null")
        void listQuotations_NullFilters_ReturnsAllPage() {
            // Given
            List<QuotationSummaryView> content = List.of(testSummaryView);
            given(quotationMapper.findWithFilters(null, null, 10, 0L)).willReturn(content);
            given(quotationMapper.countWithFilters(null, null)).willReturn(1L);

            // When
            Page<QuotationSummaryView> result = queryService.listQuotations(null, null, pageable);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
            verify(quotationMapper).findWithFilters(null, null, 10, 0L);
        }

        @Test
        @DisplayName("should return empty page when no results")
        void listQuotations_NoResults_ReturnsEmptyPage() {
            // Given
            given(quotationMapper.findWithFilters(null, null, 10, 0L)).willReturn(List.of());
            given(quotationMapper.countWithFilters(null, null)).willReturn(0L);

            // When
            Page<QuotationSummaryView> result = queryService.listQuotations(null, null, pageable);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getContent()).isEmpty();
            assertThat(result.getTotalElements()).isEqualTo(0L);
        }

        @Test
        @DisplayName("should handle pagination offset correctly")
        void listQuotations_SecondPage_CorrectOffset() {
            // Given
            Pageable secondPage = PageRequest.of(1, 10);
            List<QuotationSummaryView> content = List.of(testSummaryView);
            // Pageable.getOffset() returns long, cast to int for mapper call expectation
            given(quotationMapper.findWithFilters(null, null, 10, 10L)).willReturn(content);
            given(quotationMapper.countWithFilters(null, null)).willReturn(11L);

            // When
            Page<QuotationSummaryView> result = queryService.listQuotations(null, null, secondPage);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getNumber()).isEqualTo(1);
            assertThat(result.getTotalElements()).isEqualTo(11L);
            assertThat(result.getTotalPages()).isEqualTo(2);
            verify(quotationMapper).findWithFilters(null, null, 10, 10L);
        }
    }
}
