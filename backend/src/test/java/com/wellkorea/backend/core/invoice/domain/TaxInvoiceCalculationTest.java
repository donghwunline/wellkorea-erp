package com.wellkorea.backend.core.invoice.domain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for TaxInvoice calculation methods.
 * Tests: recalculateTotals() formula: totalAmount = (totalBeforeTax + totalTax) - discountAmount
 */
@Tag("unit")
@DisplayName("TaxInvoice Calculation Tests")
class TaxInvoiceCalculationTest {

    /**
     * Helper to create an invoice line item.
     */
    private InvoiceLineItem createLineItem(Long productId, BigDecimal quantity, BigDecimal unitPrice) {
        return InvoiceLineItem.builder()
                .productId(productId)
                .productName("Product " + productId)
                .productSku("SKU-" + productId)
                .quantityInvoiced(quantity)
                .unitPrice(unitPrice)
                .build();
    }

    /**
     * Helper to create a TaxInvoice with specified tax rate and discount.
     */
    private TaxInvoice createInvoice(BigDecimal taxRate, BigDecimal discountAmount) {
        return TaxInvoice.builder()
                .projectId(1L)
                .quotationId(1L)
                .invoiceNumber("INV-2025-0001")
                .issueDate(LocalDate.now())
                .dueDate(LocalDate.now().plusDays(30))
                .taxRate(taxRate)
                .discountAmount(discountAmount)
                .createdById(1L)
                .build();
    }

    @Nested
    @DisplayName("recalculateTotals")
    class RecalculateTotalsTests {

        @Test
        @DisplayName("should compute tax on full subtotal")
        void shouldComputeTaxOnFullSubtotal() {
            // Given: line items totaling 100000, taxRate=10%
            TaxInvoice invoice = createInvoice(new BigDecimal("10.0"), BigDecimal.ZERO);
            invoice.addLineItem(createLineItem(1L, new BigDecimal("50"), new BigDecimal("1000")));  // 50000
            invoice.addLineItem(createLineItem(2L, new BigDecimal("50"), new BigDecimal("1000")));  // 50000

            // Then:
            // - Subtotal = 100000
            // - Tax = 100000 * 10% = 10000
            assertThat(invoice.getTotalBeforeTax()).isEqualByComparingTo(new BigDecimal("100000.00"));
            assertThat(invoice.getTotalTax()).isEqualByComparingTo(new BigDecimal("10000.00"));
        }

        @Test
        @DisplayName("should compute final amount: subtotal + tax - discount")
        void shouldComputeFinalAmount_SubtotalPlusTaxMinusDiscount() {
            // Given: subtotal=100000, taxRate=10%, discount=5000
            TaxInvoice invoice = createInvoice(new BigDecimal("10.0"), new BigDecimal("5000"));
            invoice.addLineItem(createLineItem(1L, new BigDecimal("100"), new BigDecimal("1000")));

            // Then:
            // - Subtotal = 100000
            // - Tax = 10000
            // - Discount = 5000
            // - Total = (100000 + 10000) - 5000 = 105000
            assertThat(invoice.getTotalBeforeTax()).isEqualByComparingTo(new BigDecimal("100000.00"));
            assertThat(invoice.getTotalTax()).isEqualByComparingTo(new BigDecimal("10000.00"));
            assertThat(invoice.getDiscountAmount()).isEqualByComparingTo(new BigDecimal("5000.00"));
            assertThat(invoice.getTotalAmount()).isEqualByComparingTo(new BigDecimal("105000.00"));
        }

        @Test
        @DisplayName("should handle zero discount")
        void shouldHandleZeroDiscount() {
            // Given: subtotal=100000, taxRate=10%, discount=0
            TaxInvoice invoice = createInvoice(new BigDecimal("10.0"), BigDecimal.ZERO);
            invoice.addLineItem(createLineItem(1L, new BigDecimal("100"), new BigDecimal("1000")));

            // Then:
            // - Total = (100000 + 10000) - 0 = 110000
            assertThat(invoice.getTotalAmount()).isEqualByComparingTo(new BigDecimal("110000.00"));
            assertThat(invoice.getDiscountAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("should handle zero tax rate")
        void shouldHandleZeroTaxRate() {
            // Given: subtotal=100000, taxRate=0%, discount=5000
            TaxInvoice invoice = createInvoice(BigDecimal.ZERO, new BigDecimal("5000"));
            invoice.addLineItem(createLineItem(1L, new BigDecimal("100"), new BigDecimal("1000")));

            // Then:
            // - Tax = 0
            // - Total = (100000 + 0) - 5000 = 95000
            assertThat(invoice.getTotalTax()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(invoice.getTotalAmount()).isEqualByComparingTo(new BigDecimal("95000.00"));
        }

        @Test
        @DisplayName("should handle max discount equal to amount before discount")
        void shouldHandleMaxDiscount_EqualToAmountBeforeDiscount() {
            // Given: subtotal=100000, taxRate=10%, discount=110000 (= subtotal + tax)
            TaxInvoice invoice = createInvoice(new BigDecimal("10.0"), new BigDecimal("110000"));
            invoice.addLineItem(createLineItem(1L, new BigDecimal("100"), new BigDecimal("1000")));

            // Then:
            // - Total = (100000 + 10000) - 110000 = 0
            assertThat(invoice.getTotalAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("should recalculate when line item is added")
        void shouldRecalculate_WhenLineItemAdded() {
            // Given: invoice with one line item
            TaxInvoice invoice = createInvoice(new BigDecimal("10.0"), new BigDecimal("1000"));
            invoice.addLineItem(createLineItem(1L, new BigDecimal("10"), new BigDecimal("1000")));
            // Initial: subtotal=10000, tax=1000, total = (10000+1000)-1000 = 10000

            assertThat(invoice.getTotalBeforeTax()).isEqualByComparingTo(new BigDecimal("10000.00"));
            assertThat(invoice.getTotalAmount()).isEqualByComparingTo(new BigDecimal("10000.00"));

            // When: add another line item
            invoice.addLineItem(createLineItem(2L, new BigDecimal("10"), new BigDecimal("1000")));
            // After: subtotal=20000, tax=2000, total = (20000+2000)-1000 = 21000

            // Then
            assertThat(invoice.getTotalBeforeTax()).isEqualByComparingTo(new BigDecimal("20000.00"));
            assertThat(invoice.getTotalTax()).isEqualByComparingTo(new BigDecimal("2000.00"));
            assertThat(invoice.getTotalAmount()).isEqualByComparingTo(new BigDecimal("21000.00"));
        }

        @Test
        @DisplayName("should recalculate when line item is removed")
        void shouldRecalculate_WhenLineItemRemoved() {
            // Given: invoice with two line items
            TaxInvoice invoice = createInvoice(new BigDecimal("10.0"), new BigDecimal("1000"));
            InvoiceLineItem item1 = createLineItem(1L, new BigDecimal("10"), new BigDecimal("1000"));
            InvoiceLineItem item2 = createLineItem(2L, new BigDecimal("10"), new BigDecimal("1000"));
            invoice.addLineItem(item1);
            invoice.addLineItem(item2);
            // Initial: subtotal=20000, tax=2000, total = (20000+2000)-1000 = 21000

            assertThat(invoice.getTotalAmount()).isEqualByComparingTo(new BigDecimal("21000.00"));

            // When: remove one line item
            invoice.removeLineItem(item2);
            // After: subtotal=10000, tax=1000, total = (10000+1000)-1000 = 10000

            // Then
            assertThat(invoice.getTotalBeforeTax()).isEqualByComparingTo(new BigDecimal("10000.00"));
            assertThat(invoice.getTotalTax()).isEqualByComparingTo(new BigDecimal("1000.00"));
            assertThat(invoice.getTotalAmount()).isEqualByComparingTo(new BigDecimal("10000.00"));
        }

        @Test
        @DisplayName("should round tax amount to 2 decimal places using HALF_UP")
        void shouldRoundTaxAmount_HalfUp() {
            // Given: subtotal that produces fractional tax
            // 33333.35 * 10% = 3333.335 → rounds to 3333.34
            TaxInvoice invoice = createInvoice(new BigDecimal("10.0"), BigDecimal.ZERO);
            invoice.addLineItem(createLineItem(1L, new BigDecimal("33.33335"), new BigDecimal("1000")));
            // Subtotal = 33333.35

            // Then
            assertThat(invoice.getTotalBeforeTax()).isEqualByComparingTo(new BigDecimal("33333.35"));
            assertThat(invoice.getTotalTax()).isEqualByComparingTo(new BigDecimal("3333.34"));  // HALF_UP
        }

        @Test
        @DisplayName("should handle empty line items")
        void shouldHandleEmptyLineItems() {
            // Given: invoice with no line items
            TaxInvoice invoice = createInvoice(new BigDecimal("10.0"), new BigDecimal("1000"));

            // Then: all amounts should be zero (except discount which is explicitly set)
            assertThat(invoice.getTotalBeforeTax()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(invoice.getTotalTax()).isEqualByComparingTo(BigDecimal.ZERO);
            // Total = (0 + 0) - 1000 = -1000 (technically possible, guard should prevent)
            assertThat(invoice.getTotalAmount()).isEqualByComparingTo(new BigDecimal("-1000.00"));
        }

        @Test
        @DisplayName("should handle high precision calculations correctly")
        void shouldHandleHighPrecisionCalculations() {
            // Given: values that test precision
            TaxInvoice invoice = createInvoice(new BigDecimal("10.5"), new BigDecimal("1234.56"));
            invoice.addLineItem(createLineItem(1L, new BigDecimal("7.777"), new BigDecimal("9999.99")));
            // Subtotal = 7.777 * 9999.99 = 77779.92223

            // Then: verify calculation is consistent
            BigDecimal expectedSubtotal = new BigDecimal("7.777").multiply(new BigDecimal("9999.99"));
            assertThat(invoice.getTotalBeforeTax()).isEqualByComparingTo(expectedSubtotal);

            // Tax = subtotal * 10.5 / 100
            // Total = (subtotal + tax) - 1234.56
            BigDecimal expectedTotal = invoice.getTotalBeforeTax()
                    .add(invoice.getTotalTax())
                    .subtract(invoice.getDiscountAmount());
            assertThat(invoice.getTotalAmount()).isEqualByComparingTo(expectedTotal);
        }

        @Test
        @DisplayName("should handle 100% tax rate")
        void shouldHandle100PercentTaxRate() {
            // Given: 100% tax rate
            TaxInvoice invoice = createInvoice(new BigDecimal("100"), BigDecimal.ZERO);
            invoice.addLineItem(createLineItem(1L, new BigDecimal("10"), new BigDecimal("1000")));
            // Subtotal = 10000, Tax = 10000

            // Then
            assertThat(invoice.getTotalBeforeTax()).isEqualByComparingTo(new BigDecimal("10000.00"));
            assertThat(invoice.getTotalTax()).isEqualByComparingTo(new BigDecimal("10000.00"));
            assertThat(invoice.getTotalAmount()).isEqualByComparingTo(new BigDecimal("20000.00"));
        }
    }
}
