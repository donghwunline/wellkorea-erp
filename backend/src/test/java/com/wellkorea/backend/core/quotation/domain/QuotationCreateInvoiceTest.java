package com.wellkorea.backend.core.quotation.domain;

import com.wellkorea.backend.core.auth.domain.User;
import com.wellkorea.backend.core.auth.domain.vo.Role;
import com.wellkorea.backend.core.invoice.application.InvoiceNumberGenerator;
import com.wellkorea.backend.core.invoice.domain.InvoiceLineItemInput;
import com.wellkorea.backend.core.invoice.domain.QuotationInvoiceGuard;
import com.wellkorea.backend.core.invoice.domain.TaxInvoice;
import com.wellkorea.backend.core.project.domain.Project;
import com.wellkorea.backend.core.project.domain.ProjectStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Unit tests for Quotation.createInvoice() factory method.
 * Tests tax rate inheritance and manual discount handling.
 */
@Tag("unit")
@ExtendWith(MockitoExtension.class)
@DisplayName("Quotation.createInvoice() Tax and Discount Tests")
class QuotationCreateInvoiceTest {

    private Project testProject;
    private User testUser;

    // Stub that always passes validation
    private final QuotationInvoiceGuard passGuard = new QuotationInvoiceGuard() {
        @Override
        public void validateAndThrow(com.wellkorea.backend.core.quotation.domain.Quotation quotation, List<InvoiceLineItemInput> lineItems) {
            // No-op - always passes
        }

        @Override
        public void validateDiscountQuota(com.wellkorea.backend.core.quotation.domain.Quotation quotation, BigDecimal requestedDiscount, Long excludeInvoiceId) {
            // No-op - always passes
        }
    };

    @Mock
    private InvoiceNumberGenerator mockGenerator;

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

        // Configure mock to return a stub invoice number (lenient: not all tests use the generator)
        org.mockito.Mockito.lenient().when(mockGenerator.generate()).thenReturn("INV-2025-0001");
    }

    /**
     * Helper to create an approved Quotation (SENT status).
     */
    private Quotation createApprovedQuotation(BigDecimal subtotal, BigDecimal taxRate, BigDecimal discountAmount) {
        return Quotation.builder()
                .id(1L)
                .project(testProject)
                .status(QuotationStatus.SENT)  // Approved state for invoicing
                .totalAmount(subtotal)
                .taxRate(taxRate)
                .discountAmount(discountAmount)
                .version(1)
                .validityDays(30)
                .quotationDate(LocalDate.now())
                .createdBy(testUser)
                .build();
    }

    /**
     * Helper to create invoice line item input.
     */
    private InvoiceLineItemInput createLineItemInput(Long productId, BigDecimal quantity, BigDecimal unitPrice) {
        return new InvoiceLineItemInput(
                productId,
                "Product " + productId,
                "SKU-" + productId,
                quantity,
                unitPrice
        );
    }

    @Nested
    @DisplayName("Tax Rate Inheritance")
    class TaxRateInheritanceTests {

        @Test
        @DisplayName("should inherit 15% tax rate from quotation")
        void shouldInheritTaxRate_15Percent() {
            // Given: quotation with 15% tax rate
            Quotation quotation = createApprovedQuotation(
                    new BigDecimal("100000"),
                    new BigDecimal("15.0"),
                    BigDecimal.ZERO
            );

            List<InvoiceLineItemInput> lineItems = List.of(
                    createLineItemInput(1L, new BigDecimal("10"), new BigDecimal("10000"))
            );

            // When
            TaxInvoice invoice = quotation.createInvoice(
                    passGuard,
                    mockGenerator,
                    LocalDate.now(),
                    LocalDate.now().plusDays(30),
                    "Test notes",
                    BigDecimal.ZERO,
                    lineItems,
                    1L
            );

            // Then
            assertThat(invoice.getTaxRate()).isEqualByComparingTo(new BigDecimal("15.0"));
        }

        @Test
        @DisplayName("should inherit 0% tax rate from quotation")
        void shouldInheritTaxRate_ZeroPercent() {
            // Given: quotation with 0% tax rate
            Quotation quotation = createApprovedQuotation(
                    new BigDecimal("100000"),
                    BigDecimal.ZERO,
                    BigDecimal.ZERO
            );

            List<InvoiceLineItemInput> lineItems = List.of(
                    createLineItemInput(1L, new BigDecimal("10"), new BigDecimal("10000"))
            );

            // When
            TaxInvoice invoice = quotation.createInvoice(
                    passGuard,
                    mockGenerator,
                    LocalDate.now(),
                    LocalDate.now().plusDays(30),
                    null,
                    BigDecimal.ZERO,
                    lineItems,
                    1L
            );

            // Then
            assertThat(invoice.getTaxRate()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(invoice.getTotalTax()).isEqualByComparingTo(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("should inherit 100% tax rate from quotation")
        void shouldInheritTaxRate_100Percent() {
            // Given: quotation with 100% tax rate
            Quotation quotation = createApprovedQuotation(
                    new BigDecimal("100000"),
                    new BigDecimal("100"),
                    BigDecimal.ZERO
            );

            List<InvoiceLineItemInput> lineItems = List.of(
                    createLineItemInput(1L, new BigDecimal("10"), new BigDecimal("10000"))
            );

            // When
            TaxInvoice invoice = quotation.createInvoice(
                    passGuard,
                    mockGenerator,
                    LocalDate.now(),
                    LocalDate.now().plusDays(30),
                    null,
                    BigDecimal.ZERO,
                    lineItems,
                    1L
            );

            // Then
            assertThat(invoice.getTaxRate()).isEqualByComparingTo(new BigDecimal("100"));
            // Invoice subtotal = 10 * 10000 = 100000
            // Invoice tax = 100000 * 100% = 100000
            assertThat(invoice.getTotalTax()).isEqualByComparingTo(new BigDecimal("100000.00"));
        }
    }

    @Nested
    @DisplayName("Manual Discount")
    class ManualDiscountTests {

        @Test
        @DisplayName("should apply manual discount amount to invoice")
        void shouldApplyManualDiscount() {
            Quotation quotation = createApprovedQuotation(
                    new BigDecimal("100000"),
                    new BigDecimal("10.0"),
                    new BigDecimal("10000")
            );

            List<InvoiceLineItemInput> lineItems = List.of(
                    createLineItemInput(1L, new BigDecimal("100"), new BigDecimal("1000"))
            );

            TaxInvoice invoice = quotation.createInvoice(
                    passGuard,
                    mockGenerator,
                    LocalDate.now(),
                    LocalDate.now().plusDays(30),
                    null,
                    new BigDecimal("7500"),
                    lineItems,
                    1L
            );

            assertThat(invoice.getDiscountAmount()).isEqualByComparingTo(new BigDecimal("7500"));
        }

        @Test
        @DisplayName("should default to zero discount when null is passed")
        void shouldDefaultToZeroDiscount_WhenNullPassed() {
            Quotation quotation = createApprovedQuotation(
                    new BigDecimal("100000"),
                    new BigDecimal("10.0"),
                    new BigDecimal("10000")
            );

            List<InvoiceLineItemInput> lineItems = List.of(
                    createLineItemInput(1L, new BigDecimal("50"), new BigDecimal("1000"))
            );

            TaxInvoice invoice = quotation.createInvoice(
                    passGuard,
                    mockGenerator,
                    LocalDate.now(),
                    LocalDate.now().plusDays(30),
                    null,
                    null, // null discount
                    lineItems,
                    1L
            );

            assertThat(invoice.getDiscountAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("should accept zero discount explicitly")
        void shouldAcceptZeroDiscount() {
            Quotation quotation = createApprovedQuotation(
                    new BigDecimal("100000"),
                    new BigDecimal("10.0"),
                    new BigDecimal("10000")
            );

            List<InvoiceLineItemInput> lineItems = List.of(
                    createLineItemInput(1L, new BigDecimal("50"), new BigDecimal("1000"))
            );

            TaxInvoice invoice = quotation.createInvoice(
                    passGuard,
                    mockGenerator,
                    LocalDate.now(),
                    LocalDate.now().plusDays(30),
                    null,
                    BigDecimal.ZERO,
                    lineItems,
                    1L
            );

            assertThat(invoice.getDiscountAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("should reject negative discount amount")
        void shouldRejectNegativeDiscount() {
            Quotation quotation = createApprovedQuotation(
                    new BigDecimal("100000"),
                    new BigDecimal("10.0"),
                    BigDecimal.ZERO
            );

            List<InvoiceLineItemInput> lineItems = List.of(
                    createLineItemInput(1L, new BigDecimal("50"), new BigDecimal("1000"))
            );

            assertThatThrownBy(() -> quotation.createInvoice(
                    passGuard,
                    mockGenerator,
                    LocalDate.now(),
                    LocalDate.now().plusDays(30),
                    null,
                    new BigDecimal("-100"),
                    lineItems,
                    1L
            )).isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("negative");
        }

        @Test
        @DisplayName("should apply discount with fractional amount")
        void shouldApplyFractionalDiscount() {
            Quotation quotation = createApprovedQuotation(
                    new BigDecimal("99999"),
                    new BigDecimal("10.0"),
                    new BigDecimal("9999")
            );

            List<InvoiceLineItemInput> lineItems = List.of(
                    createLineItemInput(1L, new BigDecimal("33"), new BigDecimal("999.99"))
            );

            TaxInvoice invoice = quotation.createInvoice(
                    passGuard,
                    mockGenerator,
                    LocalDate.now(),
                    LocalDate.now().plusDays(30),
                    null,
                    new BigDecimal("3333.33"),
                    lineItems,
                    1L
            );

            assertThat(invoice.getDiscountAmount()).isEqualByComparingTo(new BigDecimal("3333.33"));
        }
    }

    @Nested
    @DisplayName("Invoice Totals Calculation")
    class InvoiceTotalsTests {

        @Test
        @DisplayName("should compute correct total amount: (subtotal + tax) - discount")
        void shouldComputeCorrectTotalAmount() {
            // Given: quotation subtotal=100000, taxRate=10%, discount=5000
            Quotation quotation = createApprovedQuotation(
                    new BigDecimal("100000"),
                    new BigDecimal("10.0"),
                    new BigDecimal("5000")
            );

            List<InvoiceLineItemInput> lineItems = List.of(
                    createLineItemInput(1L, new BigDecimal("100"), new BigDecimal("1000"))
            );
            // Invoice subtotal = 100000

            TaxInvoice invoice = quotation.createInvoice(
                    passGuard,
                    mockGenerator,
                    LocalDate.now(),
                    LocalDate.now().plusDays(30),
                    null,
                    new BigDecimal("5000"),
                    lineItems,
                    1L
            );

            // Then:
            // - Invoice subtotal = 100000
            // - Invoice tax = 100000 * 10% = 10000
            // - Invoice discount = 5000 (manual)
            // - Invoice total = (100000 + 10000) - 5000 = 105000
            assertThat(invoice.getTotalBeforeTax()).isEqualByComparingTo(new BigDecimal("100000.00"));
            assertThat(invoice.getTotalTax()).isEqualByComparingTo(new BigDecimal("10000.00"));
            assertThat(invoice.getDiscountAmount()).isEqualByComparingTo(new BigDecimal("5000.00"));
            assertThat(invoice.getTotalAmount()).isEqualByComparingTo(new BigDecimal("105000.00"));
        }

        @Test
        @DisplayName("tax should be calculated on full subtotal, not after discount")
        void taxShouldBeOnSubtotal_NotAfterDiscount() {
            // Given: quotation subtotal=100000, taxRate=10%, discount=10000
            Quotation quotation = createApprovedQuotation(
                    new BigDecimal("100000"),
                    new BigDecimal("10.0"),
                    new BigDecimal("10000")
            );

            List<InvoiceLineItemInput> lineItems = List.of(
                    createLineItemInput(1L, new BigDecimal("50"), new BigDecimal("1000"))
            );
            // Invoice subtotal = 50000

            TaxInvoice invoice = quotation.createInvoice(
                    passGuard,
                    mockGenerator,
                    LocalDate.now(),
                    LocalDate.now().plusDays(30),
                    null,
                    new BigDecimal("5000"),
                    lineItems,
                    1L
            );

            // Then:
            // - Invoice subtotal = 50000
            // - Invoice tax = 50000 * 10% = 5000 (tax on subtotal, not after discount)
            // - Invoice discount = 5000 (manual)
            // - Invoice total = (50000 + 5000) - 5000 = 50000
            assertThat(invoice.getTotalBeforeTax()).isEqualByComparingTo(new BigDecimal("50000.00"));
            assertThat(invoice.getTotalTax()).isEqualByComparingTo(new BigDecimal("5000.00"));
            assertThat(invoice.getDiscountAmount()).isEqualByComparingTo(new BigDecimal("5000.00"));
            assertThat(invoice.getTotalAmount()).isEqualByComparingTo(new BigDecimal("50000.00"));
        }

        @Test
        @DisplayName("should handle partial invoice with zero discount")
        void shouldHandlePartialInvoice_WithZeroDiscount() {
            // Given: quotation subtotal=99999, taxRate=10%
            Quotation quotation = createApprovedQuotation(
                    new BigDecimal("99999"),
                    new BigDecimal("10.0"),
                    new BigDecimal("9999")
            );

            List<InvoiceLineItemInput> lineItems = List.of(
                    createLineItemInput(1L, new BigDecimal("33.3333"), new BigDecimal("999.99"))
            );

            TaxInvoice invoice = quotation.createInvoice(
                    passGuard,
                    mockGenerator,
                    LocalDate.now(),
                    LocalDate.now().plusDays(30),
                    null,
                    BigDecimal.ZERO,
                    lineItems,
                    1L
            );

            // Then: verify rounding is applied correctly
            assertThat(invoice.getTotalBeforeTax()).isNotNull();
            assertThat(invoice.getTotalTax()).isNotNull();
            assertThat(invoice.getDiscountAmount()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(invoice.getTotalAmount()).isNotNull();

            // Verify the formula: totalAmount = (subtotal + tax) - discount
            BigDecimal expectedTotal = invoice.getTotalBeforeTax()
                    .add(invoice.getTotalTax())
                    .subtract(invoice.getDiscountAmount());
            assertThat(invoice.getTotalAmount()).isEqualByComparingTo(expectedTotal);
        }
    }
}
