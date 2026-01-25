package com.wellkorea.backend.finance.domain;

import com.wellkorea.backend.finance.domain.vo.VendorPaymentMethod;
import org.junit.jupiter.api.*;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Unit tests for VendorPayment domain entity.
 * <p>
 * Tests business rules for:
 * - Builder validation
 * - Partial payment detection
 */
@Tag("unit")
@DisplayName("VendorPayment Domain Tests")
class VendorPaymentTest {

    // ==========================================================================
    // Builder Validation Tests
    // ==========================================================================

    @Nested
    @DisplayName("Builder Validation")
    class BuilderValidationTests {

        @Test
        @DisplayName("should throw when paymentDate is null")
        void shouldThrowWhenPaymentDateIsNull() {
            assertThatThrownBy(() -> VendorPayment.builder()
                    .amount(new BigDecimal("1000"))
                    .paymentMethod(VendorPaymentMethod.BANK_TRANSFER)
                    .recordedById(1L)
                    .build())
                    .isInstanceOf(NullPointerException.class)
                    .hasMessageContaining("Payment date");
        }

        @Test
        @DisplayName("should throw when amount is null")
        void shouldThrowWhenAmountIsNull() {
            assertThatThrownBy(() -> VendorPayment.builder()
                    .paymentDate(LocalDate.now())
                    .paymentMethod(VendorPaymentMethod.BANK_TRANSFER)
                    .recordedById(1L)
                    .build())
                    .isInstanceOf(NullPointerException.class)
                    .hasMessageContaining("Amount");
        }

        @Test
        @DisplayName("should throw when paymentMethod is null")
        void shouldThrowWhenPaymentMethodIsNull() {
            assertThatThrownBy(() -> VendorPayment.builder()
                    .paymentDate(LocalDate.now())
                    .amount(new BigDecimal("1000"))
                    .recordedById(1L)
                    .build())
                    .isInstanceOf(NullPointerException.class)
                    .hasMessageContaining("Payment method");
        }

        @Test
        @DisplayName("should throw when recordedById is null")
        void shouldThrowWhenRecordedByIdIsNull() {
            assertThatThrownBy(() -> VendorPayment.builder()
                    .paymentDate(LocalDate.now())
                    .amount(new BigDecimal("1000"))
                    .paymentMethod(VendorPaymentMethod.BANK_TRANSFER)
                    .build())
                    .isInstanceOf(NullPointerException.class)
                    .hasMessageContaining("Recorded by");
        }

        @Test
        @DisplayName("should throw when amount is zero")
        void shouldThrowWhenAmountIsZero() {
            assertThatThrownBy(() -> VendorPayment.builder()
                    .paymentDate(LocalDate.now())
                    .amount(BigDecimal.ZERO)
                    .paymentMethod(VendorPaymentMethod.BANK_TRANSFER)
                    .recordedById(1L)
                    .build())
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("positive");
        }

        @Test
        @DisplayName("should throw when amount is negative")
        void shouldThrowWhenAmountIsNegative() {
            assertThatThrownBy(() -> VendorPayment.builder()
                    .paymentDate(LocalDate.now())
                    .amount(new BigDecimal("-100"))
                    .paymentMethod(VendorPaymentMethod.BANK_TRANSFER)
                    .recordedById(1L)
                    .build())
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("positive");
        }

        @Test
        @DisplayName("should build successfully with valid required fields")
        void shouldBuildSuccessfullyWithValidFields() {
            VendorPayment payment = VendorPayment.builder()
                    .paymentDate(LocalDate.of(2025, 1, 15))
                    .amount(new BigDecimal("1000"))
                    .paymentMethod(VendorPaymentMethod.BANK_TRANSFER)
                    .recordedById(1L)
                    .referenceNumber("TXN-123")
                    .notes("Test payment")
                    .build();

            assertThat(payment.getPaymentDate()).isEqualTo(LocalDate.of(2025, 1, 15));
            assertThat(payment.getAmount()).isEqualByComparingTo(new BigDecimal("1000"));
            assertThat(payment.getPaymentMethod()).isEqualTo(VendorPaymentMethod.BANK_TRANSFER);
            assertThat(payment.getRecordedById()).isEqualTo(1L);
            assertThat(payment.getReferenceNumber()).isEqualTo("TXN-123");
            assertThat(payment.getNotes()).isEqualTo("Test payment");
            assertThat(payment.getCreatedAt()).isNotNull();
        }
    }

    // ==========================================================================
    // Partial Payment Detection Tests
    // ==========================================================================

    @Nested
    @DisplayName("Partial Payment Detection")
    class PartialPaymentDetectionTests {

        @Test
        @DisplayName("should return false when accountsPayable is null")
        void shouldReturnFalseWhenAccountsPayableIsNull() {
            VendorPayment payment = VendorPayment.builder()
                    .paymentDate(LocalDate.now())
                    .amount(new BigDecimal("500"))
                    .paymentMethod(VendorPaymentMethod.BANK_TRANSFER)
                    .recordedById(1L)
                    .build();

            assertThat(payment.getAccountsPayable()).isNull();
            assertThat(payment.isPartialPayment()).isFalse();
        }

        @Test
        @DisplayName("should return true when payment is less than total amount")
        void shouldReturnTrueWhenPaymentIsLessThanTotalAmount() {
            // Given
            AccountsPayable mockAp = mock(AccountsPayable.class);
            when(mockAp.getTotalAmount()).thenReturn(new BigDecimal("1000"));

            VendorPayment payment = VendorPayment.builder()
                    .paymentDate(LocalDate.now())
                    .amount(new BigDecimal("500"))
                    .paymentMethod(VendorPaymentMethod.BANK_TRANSFER)
                    .recordedById(1L)
                    .build();

            // When - simulate setting AP (normally done by addPayment)
            payment.setAccountsPayable(mockAp);

            // Then
            assertThat(payment.isPartialPayment()).isTrue();
        }

        @Test
        @DisplayName("should return false when payment equals total amount")
        void shouldReturnFalseWhenPaymentEqualsTotalAmount() {
            // Given
            AccountsPayable mockAp = mock(AccountsPayable.class);
            when(mockAp.getTotalAmount()).thenReturn(new BigDecimal("1000"));

            VendorPayment payment = VendorPayment.builder()
                    .paymentDate(LocalDate.now())
                    .amount(new BigDecimal("1000"))
                    .paymentMethod(VendorPaymentMethod.BANK_TRANSFER)
                    .recordedById(1L)
                    .build();

            // When
            payment.setAccountsPayable(mockAp);

            // Then
            assertThat(payment.isPartialPayment()).isFalse();
        }
    }

    // ==========================================================================
    // Getter Tests
    // ==========================================================================

    @Nested
    @DisplayName("Getters")
    class GetterTests {

        @Test
        @DisplayName("should return null accountsPayableId when accountsPayable is null")
        void shouldReturnNullAccountsPayableIdWhenAccountsPayableIsNull() {
            VendorPayment payment = VendorPayment.builder()
                    .paymentDate(LocalDate.now())
                    .amount(new BigDecimal("500"))
                    .paymentMethod(VendorPaymentMethod.BANK_TRANSFER)
                    .recordedById(1L)
                    .build();

            assertThat(payment.getAccountsPayableId()).isNull();
        }

        @Test
        @DisplayName("should return accountsPayableId when accountsPayable is set")
        void shouldReturnAccountsPayableIdWhenAccountsPayableIsSet() {
            // Given
            AccountsPayable mockAp = mock(AccountsPayable.class);
            when(mockAp.getId()).thenReturn(100L);

            VendorPayment payment = VendorPayment.builder()
                    .paymentDate(LocalDate.now())
                    .amount(new BigDecimal("500"))
                    .paymentMethod(VendorPaymentMethod.BANK_TRANSFER)
                    .recordedById(1L)
                    .build();

            // When
            payment.setAccountsPayable(mockAp);

            // Then
            assertThat(payment.getAccountsPayableId()).isEqualTo(100L);
        }
    }
}
