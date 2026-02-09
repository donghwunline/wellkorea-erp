package com.wellkorea.backend.core.quotation.domain;

import com.wellkorea.backend.core.auth.domain.User;
import com.wellkorea.backend.core.auth.domain.vo.Role;
import com.wellkorea.backend.core.invoice.application.InvoiceNumberGenerator;
import com.wellkorea.backend.core.invoice.domain.InvoiceLineItemInput;
import com.wellkorea.backend.core.invoice.domain.QuotationInvoiceGuard;
import com.wellkorea.backend.core.invoice.domain.TaxInvoice;
import com.wellkorea.backend.core.project.domain.Project;
import com.wellkorea.backend.core.project.domain.ProjectStatus;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for Quotation.createInvoice() factory method.
 * Tests tax rate inheritance and invoice total calculation.
 */
@Tag("unit")
@ExtendWith(MockitoExtension.class)
@DisplayName("Quotation.createInvoice() Tax and Total Tests")
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
            Quotation quotation = createApprovedQuotation(
                    new BigDecimal("100000"),
                    new BigDecimal("15.0"),
                    BigDecimal.ZERO
            );

            List<InvoiceLineItemInput> lineItems = List.of(
                    createLineItemInput(1L, new BigDecimal("10"), new BigDecimal("10000"))
            );

            TaxInvoice invoice = quotation.createInvoice(
                    passGuard,
                    mockGenerator,
                    LocalDate.now(),
                    LocalDate.now().plusDays(30),
                    "Test notes",
                    lineItems,
                    1L
            );

            assertThat(invoice.getTaxRate()).isEqualByComparingTo(new BigDecimal("15.0"));
        }

        @Test
        @DisplayName("should inherit 0% tax rate from quotation")
        void shouldInheritTaxRate_ZeroPercent() {
            Quotation quotation = createApprovedQuotation(
                    new BigDecimal("100000"),
                    BigDecimal.ZERO,
                    BigDecimal.ZERO
            );

            List<InvoiceLineItemInput> lineItems = List.of(
                    createLineItemInput(1L, new BigDecimal("10"), new BigDecimal("10000"))
            );

            TaxInvoice invoice = quotation.createInvoice(
                    passGuard,
                    mockGenerator,
                    LocalDate.now(),
                    LocalDate.now().plusDays(30),
                    null,
                    lineItems,
                    1L
            );

            assertThat(invoice.getTaxRate()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(invoice.getTotalTax()).isEqualByComparingTo(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("should inherit 100% tax rate from quotation")
        void shouldInheritTaxRate_100Percent() {
            Quotation quotation = createApprovedQuotation(
                    new BigDecimal("100000"),
                    new BigDecimal("100"),
                    BigDecimal.ZERO
            );

            List<InvoiceLineItemInput> lineItems = List.of(
                    createLineItemInput(1L, new BigDecimal("10"), new BigDecimal("10000"))
            );

            TaxInvoice invoice = quotation.createInvoice(
                    passGuard,
                    mockGenerator,
                    LocalDate.now(),
                    LocalDate.now().plusDays(30),
                    null,
                    lineItems,
                    1L
            );

            assertThat(invoice.getTaxRate()).isEqualByComparingTo(new BigDecimal("100"));
            assertThat(invoice.getTotalTax()).isEqualByComparingTo(new BigDecimal("100000.00"));
        }
    }

    @Nested
    @DisplayName("Invoice Totals Calculation")
    class InvoiceTotalsTests {

        @Test
        @DisplayName("should compute correct gross total: subtotal + tax")
        void shouldComputeCorrectGrossTotal() {
            Quotation quotation = createApprovedQuotation(
                    new BigDecimal("100000"),
                    new BigDecimal("10.0"),
                    new BigDecimal("5000")
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
                    lineItems,
                    1L
            );

            // Invoice subtotal = 100000, tax = 10000, total = 110000 (gross)
            assertThat(invoice.getTotalBeforeTax()).isEqualByComparingTo(new BigDecimal("100000.00"));
            assertThat(invoice.getTotalTax()).isEqualByComparingTo(new BigDecimal("10000.00"));
            assertThat(invoice.getTotalAmount()).isEqualByComparingTo(new BigDecimal("110000.00"));
        }

        @Test
        @DisplayName("should have zero discount amount (no DISCOUNT payments yet)")
        void shouldHaveZeroDiscountAmount() {
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
                    lineItems,
                    1L
            );

            // No DISCOUNT payments have been recorded yet
            assertThat(invoice.getDiscountAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("should handle partial invoice correctly")
        void shouldHandlePartialInvoice() {
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
                    lineItems,
                    1L
            );

            // Verify rounding is applied correctly
            assertThat(invoice.getTotalBeforeTax()).isNotNull();
            assertThat(invoice.getTotalTax()).isNotNull();
            assertThat(invoice.getTotalAmount()).isNotNull();

            // Verify the formula: totalAmount = subtotal + tax
            BigDecimal expectedTotal = invoice.getTotalBeforeTax().add(invoice.getTotalTax());
            assertThat(invoice.getTotalAmount()).isEqualByComparingTo(expectedTotal);
        }
    }
}
