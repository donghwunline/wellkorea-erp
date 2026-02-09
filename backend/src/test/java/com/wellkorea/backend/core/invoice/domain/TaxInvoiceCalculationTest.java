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
 * Tests: recalculateTotals() formula: totalAmount = totalBeforeTax + totalTax
 * Discount is tracked as DISCOUNT payments, not on the invoice itself.
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
     * Helper to create a TaxInvoice with specified tax rate.
     */
    private TaxInvoice createInvoice(BigDecimal taxRate) {
        return TaxInvoice.builder()
                .projectId(1L)
                .quotationId(1L)
                .invoiceNumber("INV-2025-0001")
                .issueDate(LocalDate.now())
                .dueDate(LocalDate.now().plusDays(30))
                .taxRate(taxRate)
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
            TaxInvoice invoice = createInvoice(new BigDecimal("10.0"));
            invoice.addLineItem(createLineItem(1L, new BigDecimal("50"), new BigDecimal("1000")));  // 50000
            invoice.addLineItem(createLineItem(2L, new BigDecimal("50"), new BigDecimal("1000")));  // 50000

            // Then:
            // - Subtotal = 100000
            // - Tax = 100000 * 10% = 10000
            assertThat(invoice.getTotalBeforeTax()).isEqualByComparingTo(new BigDecimal("100000.00"));
            assertThat(invoice.getTotalTax()).isEqualByComparingTo(new BigDecimal("10000.00"));
        }

        @Test
        @DisplayName("should compute total as subtotal + tax (gross amount)")
        void shouldComputeTotalAsGrossAmount() {
            // Given: subtotal=100000, taxRate=10%
            TaxInvoice invoice = createInvoice(new BigDecimal("10.0"));
            invoice.addLineItem(createLineItem(1L, new BigDecimal("100"), new BigDecimal("1000")));

            // Then: totalAmount = 100000 + 10000 = 110000 (gross, no discount subtracted)
            assertThat(invoice.getTotalBeforeTax()).isEqualByComparingTo(new BigDecimal("100000.00"));
            assertThat(invoice.getTotalTax()).isEqualByComparingTo(new BigDecimal("10000.00"));
            assertThat(invoice.getTotalAmount()).isEqualByComparingTo(new BigDecimal("110000.00"));
        }

        @Test
        @DisplayName("should handle zero tax rate")
        void shouldHandleZeroTaxRate() {
            // Given: subtotal=100000, taxRate=0%
            TaxInvoice invoice = createInvoice(BigDecimal.ZERO);
            invoice.addLineItem(createLineItem(1L, new BigDecimal("100"), new BigDecimal("1000")));

            // Then: totalAmount = 100000 + 0 = 100000
            assertThat(invoice.getTotalTax()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(invoice.getTotalAmount()).isEqualByComparingTo(new BigDecimal("100000.00"));
        }

        @Test
        @DisplayName("should recalculate when line item is added")
        void shouldRecalculate_WhenLineItemAdded() {
            // Given: invoice with one line item
            TaxInvoice invoice = createInvoice(new BigDecimal("10.0"));
            invoice.addLineItem(createLineItem(1L, new BigDecimal("10"), new BigDecimal("1000")));
            // Initial: subtotal=10000, tax=1000, total = 11000

            assertThat(invoice.getTotalBeforeTax()).isEqualByComparingTo(new BigDecimal("10000.00"));
            assertThat(invoice.getTotalAmount()).isEqualByComparingTo(new BigDecimal("11000.00"));

            // When: add another line item
            invoice.addLineItem(createLineItem(2L, new BigDecimal("10"), new BigDecimal("1000")));
            // After: subtotal=20000, tax=2000, total = 22000

            // Then
            assertThat(invoice.getTotalBeforeTax()).isEqualByComparingTo(new BigDecimal("20000.00"));
            assertThat(invoice.getTotalTax()).isEqualByComparingTo(new BigDecimal("2000.00"));
            assertThat(invoice.getTotalAmount()).isEqualByComparingTo(new BigDecimal("22000.00"));
        }

        @Test
        @DisplayName("should recalculate when line item is removed")
        void shouldRecalculate_WhenLineItemRemoved() {
            // Given: invoice with two line items
            TaxInvoice invoice = createInvoice(new BigDecimal("10.0"));
            InvoiceLineItem item1 = createLineItem(1L, new BigDecimal("10"), new BigDecimal("1000"));
            InvoiceLineItem item2 = createLineItem(2L, new BigDecimal("10"), new BigDecimal("1000"));
            invoice.addLineItem(item1);
            invoice.addLineItem(item2);
            // Initial: subtotal=20000, tax=2000, total = 22000

            assertThat(invoice.getTotalAmount()).isEqualByComparingTo(new BigDecimal("22000.00"));

            // When: remove one line item
            invoice.removeLineItem(item2);
            // After: subtotal=10000, tax=1000, total = 11000

            // Then
            assertThat(invoice.getTotalBeforeTax()).isEqualByComparingTo(new BigDecimal("10000.00"));
            assertThat(invoice.getTotalTax()).isEqualByComparingTo(new BigDecimal("1000.00"));
            assertThat(invoice.getTotalAmount()).isEqualByComparingTo(new BigDecimal("11000.00"));
        }

        @Test
        @DisplayName("should round tax amount to 2 decimal places using HALF_UP")
        void shouldRoundTaxAmount_HalfUp() {
            // Given: subtotal that produces fractional tax
            // 33333.35 * 10% = 3333.335 → rounds to 3333.34
            TaxInvoice invoice = createInvoice(new BigDecimal("10.0"));
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
            TaxInvoice invoice = createInvoice(new BigDecimal("10.0"));

            // Then: all amounts should be zero
            assertThat(invoice.getTotalBeforeTax()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(invoice.getTotalTax()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(invoice.getTotalAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("should handle high precision calculations correctly")
        void shouldHandleHighPrecisionCalculations() {
            // Given: values that test precision
            TaxInvoice invoice = createInvoice(new BigDecimal("10.5"));
            invoice.addLineItem(createLineItem(1L, new BigDecimal("7.777"), new BigDecimal("9999.99")));
            // Subtotal = 7.777 * 9999.99 = 77779.92223

            // Then: verify calculation is consistent
            BigDecimal expectedSubtotal = new BigDecimal("7.777").multiply(new BigDecimal("9999.99"));
            assertThat(invoice.getTotalBeforeTax()).isEqualByComparingTo(expectedSubtotal);

            // Total = subtotal + tax
            BigDecimal expectedTotal = invoice.getTotalBeforeTax().add(invoice.getTotalTax());
            assertThat(invoice.getTotalAmount()).isEqualByComparingTo(expectedTotal);
        }

        @Test
        @DisplayName("should handle 100% tax rate")
        void shouldHandle100PercentTaxRate() {
            // Given: 100% tax rate
            TaxInvoice invoice = createInvoice(new BigDecimal("100"));
            invoice.addLineItem(createLineItem(1L, new BigDecimal("10"), new BigDecimal("1000")));
            // Subtotal = 10000, Tax = 10000

            // Then
            assertThat(invoice.getTotalBeforeTax()).isEqualByComparingTo(new BigDecimal("10000.00"));
            assertThat(invoice.getTotalTax()).isEqualByComparingTo(new BigDecimal("10000.00"));
            assertThat(invoice.getTotalAmount()).isEqualByComparingTo(new BigDecimal("20000.00"));
        }
    }

    @Nested
    @DisplayName("getDiscountAmount (computed from DISCOUNT payments)")
    class DiscountAmountTests {

        @Test
        @DisplayName("should return zero when no DISCOUNT payments")
        void shouldReturnZero_WhenNoDiscountPayments() {
            TaxInvoice invoice = createInvoice(new BigDecimal("10.0"));
            invoice.addLineItem(createLineItem(1L, new BigDecimal("10"), new BigDecimal("1000")));

            assertThat(invoice.getDiscountAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("should sum DISCOUNT payments")
        void shouldSumDiscountPayments() {
            TaxInvoice invoice = createInvoice(new BigDecimal("10.0"));
            invoice.addLineItem(createLineItem(1L, new BigDecimal("10"), new BigDecimal("1000")));
            // Issue invoice to allow payments
            invoice.issue();

            // Add a DISCOUNT payment
            Payment discountPayment = Payment.builder()
                    .paymentDate(LocalDate.now())
                    .amount(new BigDecimal("2000"))
                    .paymentMethod(PaymentMethod.DISCOUNT)
                    .recordedById(1L)
                    .build();
            invoice.addPayment(discountPayment);

            assertThat(invoice.getDiscountAmount()).isEqualByComparingTo(new BigDecimal("2000"));
        }

        @Test
        @DisplayName("should not include non-DISCOUNT payments in discount amount")
        void shouldNotIncludeNonDiscountPayments() {
            TaxInvoice invoice = createInvoice(new BigDecimal("10.0"));
            invoice.addLineItem(createLineItem(1L, new BigDecimal("10"), new BigDecimal("1000")));
            invoice.issue();

            // Add a BANK_TRANSFER payment
            Payment bankPayment = Payment.builder()
                    .paymentDate(LocalDate.now())
                    .amount(new BigDecimal("5000"))
                    .paymentMethod(PaymentMethod.BANK_TRANSFER)
                    .recordedById(1L)
                    .build();
            invoice.addPayment(bankPayment);

            // Add a DISCOUNT payment
            Payment discountPayment = Payment.builder()
                    .paymentDate(LocalDate.now())
                    .amount(new BigDecimal("1000"))
                    .paymentMethod(PaymentMethod.DISCOUNT)
                    .recordedById(1L)
                    .build();
            invoice.addPayment(discountPayment);

            // Only DISCOUNT payments count
            assertThat(invoice.getDiscountAmount()).isEqualByComparingTo(new BigDecimal("1000"));
        }
    }
}
