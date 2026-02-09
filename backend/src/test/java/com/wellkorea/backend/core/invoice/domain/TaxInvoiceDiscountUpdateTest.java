package com.wellkorea.backend.core.invoice.domain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Unit tests for TaxInvoice.updateDiscountAmount().
 */
@Tag("unit")
@DisplayName("TaxInvoice.updateDiscountAmount()")
class TaxInvoiceDiscountUpdateTest {

    private TaxInvoice createDraftInvoice(BigDecimal discount) {
        TaxInvoice invoice = TaxInvoice.builder()
                .projectId(1L)
                .quotationId(1L)
                .invoiceNumber("INV-TEST-001")
                .issueDate(LocalDate.now())
                .dueDate(LocalDate.now().plusDays(30))
                .taxRate(new BigDecimal("10.0"))
                .discountAmount(discount)
                .createdById(1L)
                .build();

        // Add a line item to have non-zero subtotal
        InvoiceLineItem lineItem = InvoiceLineItem.builder()
                .productId(1L)
                .productName("Test Product")
                .productSku("SKU-001")
                .quantityInvoiced(new BigDecimal("10"))
                .unitPrice(new BigDecimal("1000"))
                .build();
        invoice.addLineItem(lineItem);
        return invoice;
    }

    @Nested
    @DisplayName("Success Cases")
    class SuccessCases {

        @Test
        @DisplayName("should update discount on DRAFT invoice")
        void shouldUpdateDiscountOnDraftInvoice() {
            TaxInvoice invoice = createDraftInvoice(BigDecimal.ZERO);

            invoice.updateDiscountAmount(new BigDecimal("500"));

            assertThat(invoice.getDiscountAmount()).isEqualByComparingTo(new BigDecimal("500"));
        }

        @Test
        @DisplayName("should recalculate totals after discount update")
        void shouldRecalculateTotalsAfterUpdate() {
            TaxInvoice invoice = createDraftInvoice(BigDecimal.ZERO);
            // Subtotal = 10 * 1000 = 10000
            // Tax = 10000 * 10% = 1000
            // Total = (10000 + 1000) - 0 = 11000
            assertThat(invoice.getTotalAmount()).isEqualByComparingTo(new BigDecimal("11000.00"));

            invoice.updateDiscountAmount(new BigDecimal("2000"));

            // Total = (10000 + 1000) - 2000 = 9000
            assertThat(invoice.getTotalAmount()).isEqualByComparingTo(new BigDecimal("9000.00"));
            assertThat(invoice.getTotalBeforeTax()).isEqualByComparingTo(new BigDecimal("10000.00"));
            assertThat(invoice.getTotalTax()).isEqualByComparingTo(new BigDecimal("1000.00"));
        }

        @Test
        @DisplayName("should allow zero discount")
        void shouldAllowZeroDiscount() {
            TaxInvoice invoice = createDraftInvoice(new BigDecimal("500"));

            invoice.updateDiscountAmount(BigDecimal.ZERO);

            assertThat(invoice.getDiscountAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        }
    }

    @Nested
    @DisplayName("Validation Failures")
    class ValidationFailures {

        @Test
        @DisplayName("should reject negative discount amount")
        void shouldRejectNegativeDiscount() {
            TaxInvoice invoice = createDraftInvoice(BigDecimal.ZERO);

            assertThatThrownBy(() -> invoice.updateDiscountAmount(new BigDecimal("-100")))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("negative");
        }

        @Test
        @DisplayName("should reject update when invoice is ISSUED")
        void shouldRejectUpdateWhenIssued() {
            TaxInvoice invoice = createDraftInvoice(BigDecimal.ZERO);
            invoice.issue(); // DRAFT -> ISSUED

            assertThatThrownBy(() -> invoice.updateDiscountAmount(new BigDecimal("500")))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("ISSUED");
        }

        @Test
        @DisplayName("should reject update when invoice is CANCELLED")
        void shouldRejectUpdateWhenCancelled() {
            TaxInvoice invoice = createDraftInvoice(BigDecimal.ZERO);
            invoice.cancel(); // DRAFT -> CANCELLED

            assertThatThrownBy(() -> invoice.updateDiscountAmount(new BigDecimal("500")))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("CANCELLED");
        }
    }
}
