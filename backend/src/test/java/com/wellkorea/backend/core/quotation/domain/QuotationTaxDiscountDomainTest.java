package com.wellkorea.backend.core.quotation.domain;

import com.wellkorea.backend.core.auth.domain.User;
import com.wellkorea.backend.core.auth.domain.vo.Role;
import com.wellkorea.backend.core.project.domain.Project;
import com.wellkorea.backend.core.project.domain.ProjectStatus;
import com.wellkorea.backend.shared.exception.BusinessException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Unit tests for Quotation tax rate and discount amount domain methods.
 * Tests: updateTaxRate(), updateDiscountAmount(), calculateTaxAmount(),
 * calculateAmountBeforeDiscount(), calculateFinalAmount()
 */
@Tag("unit")
@DisplayName("Quotation Tax and Discount Domain Tests")
class QuotationTaxDiscountDomainTest {

    private Project testProject;
    private User testUser;

    @BeforeEach
    void setUp() {
        testProject = Project.builder()
                .id(1L)
                .jobCode("WK2K25-0001-0104")
                .projectName("Test Project")
                .customerId(1L)
                .internalOwnerId(1L)
                .createdById(1L)
                .dueDate(LocalDate.now().plusMonths(1))
                .status(ProjectStatus.ACTIVE)
                .build();

        testUser = User.builder()
                .id(1L)
                .username("testuser")
                .email("test@wellkorea.com")
                .passwordHash("hashed")
                .fullName("Test User")
                .roles(Set.of(Role.SALES))
                .build();
    }

    /**
     * Helper to create a Quotation with specified subtotal, tax rate, and discount.
     */
    private Quotation createDraftQuotation(BigDecimal subtotal, BigDecimal taxRate, BigDecimal discountAmount) {
        Quotation quotation = new Quotation();
        quotation.setId(1L);
        quotation.setProject(testProject);
        quotation.setStatus(QuotationStatus.DRAFT);
        quotation.setTotalAmount(subtotal);  // totalAmount is the subtotal
        quotation.setTaxRate(taxRate);
        quotation.setDiscountAmount(discountAmount);
        quotation.setVersion(1);
        quotation.setValidityDays(30);
        quotation.setQuotationDate(LocalDate.now());
        quotation.setCreatedBy(testUser);
        return quotation;
    }

    @Nested
    @DisplayName("updateTaxRate")
    class UpdateTaxRateTests {

        @Test
        @DisplayName("should update tax rate when DRAFT and valid range")
        void shouldUpdateTaxRate_WhenDraftAndValidRange() {
            // Given
            Quotation quotation = createDraftQuotation(
                    new BigDecimal("100000"),
                    new BigDecimal("10.0"),
                    BigDecimal.ZERO
            );

            // When
            quotation.updateTaxRate(new BigDecimal("15"));

            // Then
            assertThat(quotation.getTaxRate()).isEqualByComparingTo(new BigDecimal("15"));
        }

        @Test
        @DisplayName("should throw BusinessException when not DRAFT")
        void shouldThrowBusinessException_WhenNotDraft() {
            // Given
            Quotation quotation = createDraftQuotation(
                    new BigDecimal("100000"),
                    new BigDecimal("10.0"),
                    BigDecimal.ZERO
            );
            quotation.setStatus(QuotationStatus.PENDING);

            // When/Then
            assertThatThrownBy(() -> quotation.updateTaxRate(new BigDecimal("15")))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("DRAFT");
        }

        @Test
        @DisplayName("should throw IllegalArgumentException when negative")
        void shouldThrowIllegalArgument_WhenNegative() {
            // Given
            Quotation quotation = createDraftQuotation(
                    new BigDecimal("100000"),
                    new BigDecimal("10.0"),
                    BigDecimal.ZERO
            );

            // When/Then
            assertThatThrownBy(() -> quotation.updateTaxRate(new BigDecimal("-1")))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("between 0 and 100");
        }

        @Test
        @DisplayName("should throw IllegalArgumentException when exceeds 100")
        void shouldThrowIllegalArgument_WhenExceeds100() {
            // Given
            Quotation quotation = createDraftQuotation(
                    new BigDecimal("100000"),
                    new BigDecimal("10.0"),
                    BigDecimal.ZERO
            );

            // When/Then
            assertThatThrownBy(() -> quotation.updateTaxRate(new BigDecimal("101")))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("between 0 and 100");
        }

        @Test
        @DisplayName("should accept boundary values 0 and 100")
        void shouldAcceptBoundaryValues_ZeroAnd100() {
            // Given
            Quotation quotation = createDraftQuotation(
                    new BigDecimal("100000"),
                    new BigDecimal("10.0"),
                    BigDecimal.ZERO
            );

            // When/Then - 0% tax rate
            quotation.updateTaxRate(BigDecimal.ZERO);
            assertThat(quotation.getTaxRate()).isEqualByComparingTo(BigDecimal.ZERO);

            // When/Then - 100% tax rate
            quotation.updateTaxRate(new BigDecimal("100"));
            assertThat(quotation.getTaxRate()).isEqualByComparingTo(new BigDecimal("100"));
        }
    }

    @Nested
    @DisplayName("updateDiscountAmount")
    class UpdateDiscountAmountTests {

        @Test
        @DisplayName("should update discount when DRAFT and within limit")
        void shouldUpdateDiscount_WhenDraftAndWithinLimit() {
            // Given: subtotal=10000, taxRate=10% → max discount = 11000
            Quotation quotation = createDraftQuotation(
                    new BigDecimal("10000"),
                    new BigDecimal("10.0"),
                    BigDecimal.ZERO
            );

            // When
            quotation.updateDiscountAmount(new BigDecimal("1000"));

            // Then
            assertThat(quotation.getDiscountAmount()).isEqualByComparingTo(new BigDecimal("1000"));
        }

        @Test
        @DisplayName("should throw BusinessException when not DRAFT")
        void shouldThrowBusinessException_WhenNotDraft() {
            // Given
            Quotation quotation = createDraftQuotation(
                    new BigDecimal("100000"),
                    new BigDecimal("10.0"),
                    BigDecimal.ZERO
            );
            quotation.setStatus(QuotationStatus.APPROVED);

            // When/Then
            assertThatThrownBy(() -> quotation.updateDiscountAmount(new BigDecimal("1000")))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("DRAFT");
        }

        @Test
        @DisplayName("should throw IllegalArgumentException when negative")
        void shouldThrowIllegalArgument_WhenNegative() {
            // Given
            Quotation quotation = createDraftQuotation(
                    new BigDecimal("100000"),
                    new BigDecimal("10.0"),
                    BigDecimal.ZERO
            );

            // When/Then
            assertThatThrownBy(() -> quotation.updateDiscountAmount(new BigDecimal("-100")))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("cannot be negative");
        }

        @Test
        @DisplayName("should throw BusinessException when exceeds amount before discount")
        void shouldThrowBusinessException_WhenExceedsAmountBeforeDiscount() {
            // Given: subtotal=10000, taxRate=10% → amountBeforeDiscount = 11000
            Quotation quotation = createDraftQuotation(
                    new BigDecimal("10000"),
                    new BigDecimal("10.0"),
                    BigDecimal.ZERO
            );

            // When/Then: trying to set discount of 12000 > 11000
            assertThatThrownBy(() -> quotation.updateDiscountAmount(new BigDecimal("12000")))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("cannot exceed");
        }

        @Test
        @DisplayName("should accept discount equal to amount before discount")
        void shouldAcceptDiscount_EqualToAmountBeforeDiscount() {
            // Given: subtotal=10000, taxRate=10% → amountBeforeDiscount = 11000
            Quotation quotation = createDraftQuotation(
                    new BigDecimal("10000"),
                    new BigDecimal("10.0"),
                    BigDecimal.ZERO
            );

            // When: discount exactly equals max (11000)
            quotation.updateDiscountAmount(new BigDecimal("11000"));

            // Then
            assertThat(quotation.getDiscountAmount()).isEqualByComparingTo(new BigDecimal("11000"));
            assertThat(quotation.calculateFinalAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        }
    }

    @Nested
    @DisplayName("Calculation Methods")
    class CalculationTests {

        @Test
        @DisplayName("calculateTaxAmount should compute correctly with default rate 10%")
        void calculateTaxAmount_ShouldComputeCorrectly_WithDefaultRate() {
            // Given: subtotal=100000, taxRate=10%
            Quotation quotation = createDraftQuotation(
                    new BigDecimal("100000"),
                    new BigDecimal("10.0"),
                    BigDecimal.ZERO
            );

            // When
            BigDecimal taxAmount = quotation.calculateTaxAmount();

            // Then: 100000 * 10 / 100 = 10000
            assertThat(taxAmount).isEqualByComparingTo(new BigDecimal("10000.00"));
        }

        @Test
        @DisplayName("calculateTaxAmount should round HALF_UP to 2 decimals")
        void calculateTaxAmount_ShouldRoundHalfUp() {
            // Given: subtotal=33333.5, taxRate=10% → 3333.35 → 3333.35 (already 2 decimals)
            // Use subtotal=33333.33, taxRate=10% → 3333.333 → 3333.33 (rounds down)
            // Use subtotal=33333.35, taxRate=10% → 3333.335 → 3333.34 (rounds up)
            Quotation quotation = createDraftQuotation(
                    new BigDecimal("33333.35"),
                    new BigDecimal("10.0"),
                    BigDecimal.ZERO
            );

            // When
            BigDecimal taxAmount = quotation.calculateTaxAmount();

            // Then: 33333.35 * 10 / 100 = 3333.335 → rounds to 3333.34
            assertThat(taxAmount).isEqualByComparingTo(new BigDecimal("3333.34"));
        }

        @Test
        @DisplayName("calculateAmountBeforeDiscount should add subtotal and tax")
        void calculateAmountBeforeDiscount_ShouldAddSubtotalAndTax() {
            // Given: subtotal=100000, taxRate=10%
            Quotation quotation = createDraftQuotation(
                    new BigDecimal("100000"),
                    new BigDecimal("10.0"),
                    BigDecimal.ZERO
            );

            // When
            BigDecimal amountBeforeDiscount = quotation.calculateAmountBeforeDiscount();

            // Then: 100000 + 10000 = 110000
            assertThat(amountBeforeDiscount).isEqualByComparingTo(new BigDecimal("110000.00"));
        }

        @Test
        @DisplayName("calculateFinalAmount should subtract discount from amount before discount")
        void calculateFinalAmount_ShouldSubtractDiscount() {
            // Given: subtotal=100000, taxRate=10%, discount=5000
            Quotation quotation = createDraftQuotation(
                    new BigDecimal("100000"),
                    new BigDecimal("10.0"),
                    new BigDecimal("5000")
            );

            // When
            BigDecimal finalAmount = quotation.calculateFinalAmount();

            // Then: (100000 + 10000) - 5000 = 105000
            assertThat(finalAmount).isEqualByComparingTo(new BigDecimal("105000.00"));
        }

        @Test
        @DisplayName("calculateTaxAmount with zero tax rate should return zero")
        void calculateTaxAmount_WithZeroTaxRate_ShouldReturnZero() {
            // Given: subtotal=100000, taxRate=0%
            Quotation quotation = createDraftQuotation(
                    new BigDecimal("100000"),
                    BigDecimal.ZERO,
                    BigDecimal.ZERO
            );

            // When
            BigDecimal taxAmount = quotation.calculateTaxAmount();

            // Then
            assertThat(taxAmount).isEqualByComparingTo(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("calculateTaxAmount with 100% tax rate should return subtotal")
        void calculateTaxAmount_With100PercentTaxRate_ShouldReturnSubtotal() {
            // Given: subtotal=100000, taxRate=100%
            Quotation quotation = createDraftQuotation(
                    new BigDecimal("100000"),
                    new BigDecimal("100"),
                    BigDecimal.ZERO
            );

            // When
            BigDecimal taxAmount = quotation.calculateTaxAmount();

            // Then: 100000 * 100 / 100 = 100000
            assertThat(taxAmount).isEqualByComparingTo(new BigDecimal("100000.00"));
        }

        @Test
        @DisplayName("calculateFinalAmount with zero discount should equal amount before discount")
        void calculateFinalAmount_WithZeroDiscount_ShouldEqualAmountBeforeDiscount() {
            // Given: subtotal=100000, taxRate=10%, discount=0
            Quotation quotation = createDraftQuotation(
                    new BigDecimal("100000"),
                    new BigDecimal("10.0"),
                    BigDecimal.ZERO
            );

            // When
            BigDecimal finalAmount = quotation.calculateFinalAmount();
            BigDecimal amountBeforeDiscount = quotation.calculateAmountBeforeDiscount();

            // Then
            assertThat(finalAmount).isEqualByComparingTo(amountBeforeDiscount);
            assertThat(finalAmount).isEqualByComparingTo(new BigDecimal("110000.00"));
        }

        @Test
        @DisplayName("calculateFinalAmount with max discount should return zero")
        void calculateFinalAmount_WithMaxDiscount_ShouldReturnZero() {
            // Given: subtotal=100000, taxRate=10%, discount=110000 (= amountBeforeDiscount)
            Quotation quotation = createDraftQuotation(
                    new BigDecimal("100000"),
                    new BigDecimal("10.0"),
                    new BigDecimal("110000")
            );

            // When
            BigDecimal finalAmount = quotation.calculateFinalAmount();

            // Then: (100000 + 10000) - 110000 = 0
            assertThat(finalAmount).isEqualByComparingTo(BigDecimal.ZERO);
        }
    }
}
