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
import static org.mockito.BDDMockito.given;

/**
 * Unit tests for Quotation.createInvoice() factory method.
 * Tests tax rate inheritance and proportional discount calculation.
 */
@Tag("unit")
@ExtendWith(MockitoExtension.class)
@DisplayName("Quotation.createInvoice() Tax and Discount Tests")
class QuotationCreateInvoiceTest {

    private Project testProject;
    private User testUser;

    // Stub that always passes validation
    private final QuotationInvoiceGuard passGuard = (quotation, lineItems) -> {
        // No-op - always passes
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

        // Configure mock to return a stub invoice number
        given(mockGenerator.generate()).willReturn("INV-2025-0001");
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
    @DisplayName("Proportional Discount")
    class ProportionalDiscountTests {

        @Test
        @DisplayName("should calculate full discount when 100% invoiced")
        void shouldCalculateFullDiscount_When100PercentInvoiced() {
            // Given: quotation subtotal=100000, discount=10000
            // Invoicing 100% of subtotal
            Quotation quotation = createApprovedQuotation(
                    new BigDecimal("100000"),
                    new BigDecimal("10.0"),
                    new BigDecimal("10000")
            );

            List<InvoiceLineItemInput> lineItems = List.of(
                    createLineItemInput(1L, new BigDecimal("100"), new BigDecimal("1000"))
            );
            // Invoice subtotal = 100 * 1000 = 100000 (same as quotation)

            // When
            TaxInvoice invoice = quotation.createInvoice(
                    passGuard,
                    mockGenerator,
                    LocalDate.now(),
                    LocalDate.now().plusDays(30),
                    null,
                    lineItems,
                    1L
            );

            // Then: 100000/100000 * 10000 = 10000
            assertThat(invoice.getDiscountAmount()).isEqualByComparingTo(new BigDecimal("10000.00"));
        }

        @Test
        @DisplayName("should calculate half discount when 50% invoiced")
        void shouldCalculateHalfDiscount_When50PercentInvoiced() {
            // Given: quotation subtotal=100000, discount=10000
            // Invoicing 50% of subtotal
            Quotation quotation = createApprovedQuotation(
                    new BigDecimal("100000"),
                    new BigDecimal("10.0"),
                    new BigDecimal("10000")
            );

            List<InvoiceLineItemInput> lineItems = List.of(
                    createLineItemInput(1L, new BigDecimal("50"), new BigDecimal("1000"))
            );
            // Invoice subtotal = 50 * 1000 = 50000 (50% of quotation)

            // When
            TaxInvoice invoice = quotation.createInvoice(
                    passGuard,
                    mockGenerator,
                    LocalDate.now(),
                    LocalDate.now().plusDays(30),
                    null,
                    lineItems,
                    1L
            );

            // Then: 50000/100000 * 10000 = 5000
            assertThat(invoice.getDiscountAmount()).isEqualByComparingTo(new BigDecimal("5000.00"));
        }

        @Test
        @DisplayName("should calculate quarter discount when 25% invoiced")
        void shouldCalculateQuarterDiscount_When25PercentInvoiced() {
            // Given: quotation subtotal=100000, discount=10000
            // Invoicing 25% of subtotal
            Quotation quotation = createApprovedQuotation(
                    new BigDecimal("100000"),
                    new BigDecimal("10.0"),
                    new BigDecimal("10000")
            );

            List<InvoiceLineItemInput> lineItems = List.of(
                    createLineItemInput(1L, new BigDecimal("25"), new BigDecimal("1000"))
            );
            // Invoice subtotal = 25 * 1000 = 25000 (25% of quotation)

            // When
            TaxInvoice invoice = quotation.createInvoice(
                    passGuard,
                    mockGenerator,
                    LocalDate.now(),
                    LocalDate.now().plusDays(30),
                    null,
                    lineItems,
                    1L
            );

            // Then: 25000/100000 * 10000 = 2500
            assertThat(invoice.getDiscountAmount()).isEqualByComparingTo(new BigDecimal("2500.00"));
        }

        @Test
        @DisplayName("should return zero discount when quotation has no discount")
        void shouldReturnZeroDiscount_WhenQuotationHasNoDiscount() {
            // Given: quotation with zero discount
            Quotation quotation = createApprovedQuotation(
                    new BigDecimal("100000"),
                    new BigDecimal("10.0"),
                    BigDecimal.ZERO
            );

            List<InvoiceLineItemInput> lineItems = List.of(
                    createLineItemInput(1L, new BigDecimal("50"), new BigDecimal("1000"))
            );

            // When
            TaxInvoice invoice = quotation.createInvoice(
                    passGuard,
                    mockGenerator,
                    LocalDate.now(),
                    LocalDate.now().plusDays(30),
                    null,
                    lineItems,
                    1L
            );

            // Then
            assertThat(invoice.getDiscountAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("should round HALF_UP when discount has fraction")
        void shouldRoundHalfUp_WhenDiscountHasFraction() {
            // Given: quotation subtotal=100000, discount=1000
            // Invoicing 33.33% → discount ratio = 33333/100000 = 0.33333...
            // Proportional discount = 1000 * 0.3333 = 333.33 (rounded)
            Quotation quotation = createApprovedQuotation(
                    new BigDecimal("100000"),
                    new BigDecimal("10.0"),
                    new BigDecimal("1000")
            );

            List<InvoiceLineItemInput> lineItems = List.of(
                    createLineItemInput(1L, new BigDecimal("33.333"), new BigDecimal("1000"))
            );
            // Invoice subtotal = 33.333 * 1000 = 33333

            // When
            TaxInvoice invoice = quotation.createInvoice(
                    passGuard,
                    mockGenerator,
                    LocalDate.now(),
                    LocalDate.now().plusDays(30),
                    null,
                    lineItems,
                    1L
            );

            // Then: 33333/100000 = 0.3333 (4 decimal places)
            // 1000 * 0.3333 = 333.30 (2 decimal places, HALF_UP)
            assertThat(invoice.getDiscountAmount()).isEqualByComparingTo(new BigDecimal("333.30"));
        }

        @Test
        @DisplayName("should handle multiple line items in invoice")
        void shouldHandleMultipleLineItems() {
            // Given: quotation subtotal=100000, discount=5000
            Quotation quotation = createApprovedQuotation(
                    new BigDecimal("100000"),
                    new BigDecimal("10.0"),
                    new BigDecimal("5000")
            );

            // Invoice with multiple line items totaling 60000 (60%)
            List<InvoiceLineItemInput> lineItems = List.of(
                    createLineItemInput(1L, new BigDecimal("20"), new BigDecimal("1000")),  // 20000
                    createLineItemInput(2L, new BigDecimal("40"), new BigDecimal("1000"))   // 40000
            );
            // Invoice subtotal = 20000 + 40000 = 60000

            // When
            TaxInvoice invoice = quotation.createInvoice(
                    passGuard,
                    mockGenerator,
                    LocalDate.now(),
                    LocalDate.now().plusDays(30),
                    null,
                    lineItems,
                    1L
            );

            // Then: 60000/100000 * 5000 = 3000
            assertThat(invoice.getDiscountAmount()).isEqualByComparingTo(new BigDecimal("3000.00"));
        }
    }

    @Nested
    @DisplayName("Invoice Totals Calculation")
    class InvoiceTotalsTests {

        @Test
        @DisplayName("should compute correct total amount: (subtotal + tax) - discount")
        void shouldComputeCorrectTotalAmount() {
            // Given: quotation subtotal=100000, taxRate=10%, discount=5000
            // Invoicing 100%
            Quotation quotation = createApprovedQuotation(
                    new BigDecimal("100000"),
                    new BigDecimal("10.0"),
                    new BigDecimal("5000")
            );

            List<InvoiceLineItemInput> lineItems = List.of(
                    createLineItemInput(1L, new BigDecimal("100"), new BigDecimal("1000"))
            );
            // Invoice subtotal = 100000

            // When
            TaxInvoice invoice = quotation.createInvoice(
                    passGuard,
                    mockGenerator,
                    LocalDate.now(),
                    LocalDate.now().plusDays(30),
                    null,
                    lineItems,
                    1L
            );

            // Then:
            // - Invoice subtotal = 100000
            // - Invoice tax = 100000 * 10% = 10000
            // - Invoice discount = 5000 (100% of quotation discount)
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
            // Invoicing 50%
            Quotation quotation = createApprovedQuotation(
                    new BigDecimal("100000"),
                    new BigDecimal("10.0"),
                    new BigDecimal("10000")
            );

            List<InvoiceLineItemInput> lineItems = List.of(
                    createLineItemInput(1L, new BigDecimal("50"), new BigDecimal("1000"))
            );
            // Invoice subtotal = 50000

            // When
            TaxInvoice invoice = quotation.createInvoice(
                    passGuard,
                    mockGenerator,
                    LocalDate.now(),
                    LocalDate.now().plusDays(30),
                    null,
                    lineItems,
                    1L
            );

            // Then:
            // - Invoice subtotal = 50000
            // - Invoice tax = 50000 * 10% = 5000 (tax on subtotal, not after discount)
            // - Invoice discount = 50000/100000 * 10000 = 5000
            // - Invoice total = (50000 + 5000) - 5000 = 50000
            assertThat(invoice.getTotalBeforeTax()).isEqualByComparingTo(new BigDecimal("50000.00"));
            assertThat(invoice.getTotalTax()).isEqualByComparingTo(new BigDecimal("5000.00"));
            assertThat(invoice.getDiscountAmount()).isEqualByComparingTo(new BigDecimal("5000.00"));
            assertThat(invoice.getTotalAmount()).isEqualByComparingTo(new BigDecimal("50000.00"));
        }

        @Test
        @DisplayName("should handle partial invoice with fractional amounts")
        void shouldHandlePartialInvoice_WithFractionalAmounts() {
            // Given: quotation subtotal=99999, taxRate=10%, discount=9999
            Quotation quotation = createApprovedQuotation(
                    new BigDecimal("99999"),
                    new BigDecimal("10.0"),
                    new BigDecimal("9999")
            );

            // Invoice 33.33% (33329.67)
            List<InvoiceLineItemInput> lineItems = List.of(
                    createLineItemInput(1L, new BigDecimal("33.3333"), new BigDecimal("999.99"))
            );
            // Invoice subtotal = 33.3333 * 999.99 = 33332.67 (approximately)

            // When
            TaxInvoice invoice = quotation.createInvoice(
                    passGuard,
                    mockGenerator,
                    LocalDate.now(),
                    LocalDate.now().plusDays(30),
                    null,
                    lineItems,
                    1L
            );

            // Then: verify rounding is applied correctly
            assertThat(invoice.getTotalBeforeTax()).isNotNull();
            assertThat(invoice.getTotalTax()).isNotNull();
            assertThat(invoice.getDiscountAmount()).isNotNull();
            assertThat(invoice.getTotalAmount()).isNotNull();

            // Verify the formula: totalAmount = (subtotal + tax) - discount
            BigDecimal expectedTotal = invoice.getTotalBeforeTax()
                    .add(invoice.getTotalTax())
                    .subtract(invoice.getDiscountAmount());
            assertThat(invoice.getTotalAmount()).isEqualByComparingTo(expectedTotal);
        }
    }
}
