package com.wellkorea.backend.finance.domain;

import com.wellkorea.backend.company.domain.Company;
import com.wellkorea.backend.finance.domain.exception.PaymentExceedsBalanceException;
import com.wellkorea.backend.finance.domain.exception.PaymentNotAllowedException;
import com.wellkorea.backend.finance.domain.vo.AccountsPayableStatus;
import com.wellkorea.backend.finance.domain.vo.DisbursementCause;
import com.wellkorea.backend.finance.domain.vo.VendorPaymentMethod;
import org.junit.jupiter.api.*;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;

/**
 * Unit tests for AccountsPayable domain entity.
 * <p>
 * Tests business rules for:
 * - Payment processing and status transitions
 * - Balance calculations
 * - Overdue detection
 * - Aging bucket calculations
 * - Cancellation rules
 * - Builder validation
 */
@Tag("unit")
@DisplayName("AccountsPayable Domain Tests")
class AccountsPayableTest {

    private Company mockVendor;
    private DisbursementCause disbursementCause;

    @BeforeEach
    void setUp() {
        mockVendor = mock(Company.class);
        disbursementCause = DisbursementCause.fromPurchaseOrder(1L, "PO-2025-000001");
    }

    private AccountsPayable createAp(BigDecimal totalAmount) {
        return AccountsPayable.builder()
                .disbursementCause(disbursementCause)
                .vendor(mockVendor)
                .totalAmount(totalAmount)
                .build();
    }

    private AccountsPayable createApWithDueDate(BigDecimal totalAmount, LocalDate dueDate) {
        return AccountsPayable.builder()
                .disbursementCause(disbursementCause)
                .vendor(mockVendor)
                .totalAmount(totalAmount)
                .dueDate(dueDate)
                .build();
    }

    private VendorPayment createPayment(BigDecimal amount) {
        return VendorPayment.builder()
                .paymentDate(LocalDate.now())
                .amount(amount)
                .paymentMethod(VendorPaymentMethod.BANK_TRANSFER)
                .recordedById(1L)
                .build();
    }

    // ==========================================================================
    // Builder Validation Tests
    // ==========================================================================

    @Nested
    @DisplayName("Builder Validation")
    class BuilderValidationTests {

        @Test
        @DisplayName("should throw when disbursementCause is null")
        void shouldThrowWhenDisbursementCauseIsNull() {
            assertThatThrownBy(() -> AccountsPayable.builder()
                    .vendor(mockVendor)
                    .totalAmount(new BigDecimal("1000"))
                    .build())
                    .isInstanceOf(NullPointerException.class)
                    .hasMessageContaining("Disbursement cause");
        }

        @Test
        @DisplayName("should throw when vendor is null")
        void shouldThrowWhenVendorIsNull() {
            assertThatThrownBy(() -> AccountsPayable.builder()
                    .disbursementCause(disbursementCause)
                    .totalAmount(new BigDecimal("1000"))
                    .build())
                    .isInstanceOf(NullPointerException.class)
                    .hasMessageContaining("Vendor");
        }

        @Test
        @DisplayName("should throw when totalAmount is null")
        void shouldThrowWhenTotalAmountIsNull() {
            assertThatThrownBy(() -> AccountsPayable.builder()
                    .disbursementCause(disbursementCause)
                    .vendor(mockVendor)
                    .build())
                    .isInstanceOf(NullPointerException.class)
                    .hasMessageContaining("Total amount");
        }

        @Test
        @DisplayName("should throw when totalAmount is zero")
        void shouldThrowWhenTotalAmountIsZero() {
            assertThatThrownBy(() -> AccountsPayable.builder()
                    .disbursementCause(disbursementCause)
                    .vendor(mockVendor)
                    .totalAmount(BigDecimal.ZERO)
                    .build())
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("positive");
        }

        @Test
        @DisplayName("should throw when totalAmount is negative")
        void shouldThrowWhenTotalAmountIsNegative() {
            assertThatThrownBy(() -> AccountsPayable.builder()
                    .disbursementCause(disbursementCause)
                    .vendor(mockVendor)
                    .totalAmount(new BigDecimal("-100"))
                    .build())
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("positive");
        }

        @Test
        @DisplayName("should build successfully with valid required fields")
        void shouldBuildSuccessfullyWithValidFields() {
            AccountsPayable ap = createAp(new BigDecimal("1000"));

            assertThat(ap.getDisbursementCause()).isEqualTo(disbursementCause);
            assertThat(ap.getVendor()).isEqualTo(mockVendor);
            assertThat(ap.getTotalAmount()).isEqualByComparingTo(new BigDecimal("1000"));
            assertThat(ap.getStatus()).isEqualTo(AccountsPayableStatus.PENDING);
            assertThat(ap.getCurrency()).isEqualTo("KRW");
        }
    }

    // ==========================================================================
    // Initial State Tests
    // ==========================================================================

    @Nested
    @DisplayName("Initial State")
    class InitialStateTests {

        @Test
        @DisplayName("should start in PENDING status")
        void shouldStartInPendingStatus() {
            AccountsPayable ap = createAp(new BigDecimal("1000"));
            assertThat(ap.getStatus()).isEqualTo(AccountsPayableStatus.PENDING);
        }

        @Test
        @DisplayName("should have zero total paid initially")
        void shouldHaveZeroTotalPaidInitially() {
            AccountsPayable ap = createAp(new BigDecimal("1000"));
            assertThat(ap.getTotalPaid()).isEqualByComparingTo(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("should have remaining balance equal to total amount initially")
        void shouldHaveFullRemainingBalanceInitially() {
            AccountsPayable ap = createAp(new BigDecimal("1000"));
            assertThat(ap.getRemainingBalance()).isEqualByComparingTo(new BigDecimal("1000"));
        }

        @Test
        @DisplayName("should not be fully paid initially")
        void shouldNotBeFullyPaidInitially() {
            AccountsPayable ap = createAp(new BigDecimal("1000"));
            assertThat(ap.isFullyPaid()).isFalse();
        }

        @Test
        @DisplayName("should have empty payments list initially")
        void shouldHaveEmptyPaymentsListInitially() {
            AccountsPayable ap = createAp(new BigDecimal("1000"));
            assertThat(ap.getPayments()).isEmpty();
        }
    }

    // ==========================================================================
    // Payment Processing Tests
    // ==========================================================================

    @Nested
    @DisplayName("Payment Processing")
    class PaymentProcessingTests {

        @Test
        @DisplayName("should transition to PARTIALLY_PAID after partial payment")
        void shouldTransitionToPartiallyPaidAfterPartialPayment() {
            // Given
            AccountsPayable ap = createAp(new BigDecimal("1000"));

            // When
            VendorPayment payment = createPayment(new BigDecimal("300"));
            ap.addPayment(payment);

            // Then
            assertThat(ap.getStatus()).isEqualTo(AccountsPayableStatus.PARTIALLY_PAID);
            assertThat(ap.getTotalPaid()).isEqualByComparingTo(new BigDecimal("300"));
            assertThat(ap.getRemainingBalance()).isEqualByComparingTo(new BigDecimal("700"));
        }

        @Test
        @DisplayName("should transition to PAID after full payment")
        void shouldTransitionToPaidAfterFullPayment() {
            // Given
            AccountsPayable ap = createAp(new BigDecimal("1000"));

            // When
            VendorPayment payment = createPayment(new BigDecimal("1000"));
            ap.addPayment(payment);

            // Then
            assertThat(ap.getStatus()).isEqualTo(AccountsPayableStatus.PAID);
            assertThat(ap.isFullyPaid()).isTrue();
            assertThat(ap.getRemainingBalance()).isEqualByComparingTo(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("should transition to PAID after multiple partial payments")
        void shouldTransitionToPaidAfterMultiplePartialPayments() {
            // Given
            AccountsPayable ap = createAp(new BigDecimal("1000"));

            // When - first payment
            ap.addPayment(createPayment(new BigDecimal("300")));
            assertThat(ap.getStatus()).isEqualTo(AccountsPayableStatus.PARTIALLY_PAID);

            // When - second payment
            ap.addPayment(createPayment(new BigDecimal("400")));
            assertThat(ap.getStatus()).isEqualTo(AccountsPayableStatus.PARTIALLY_PAID);
            assertThat(ap.getTotalPaid()).isEqualByComparingTo(new BigDecimal("700"));

            // When - final payment
            ap.addPayment(createPayment(new BigDecimal("300")));

            // Then
            assertThat(ap.getStatus()).isEqualTo(AccountsPayableStatus.PAID);
            assertThat(ap.isFullyPaid()).isTrue();
            assertThat(ap.getPayments()).hasSize(3);
        }

        @Test
        @DisplayName("should throw when payment exceeds remaining balance")
        void shouldThrowWhenPaymentExceedsRemainingBalance() {
            // Given
            AccountsPayable ap = createAp(new BigDecimal("1000"));
            ap.addPayment(createPayment(new BigDecimal("800")));

            // When / Then
            VendorPayment excessivePayment = createPayment(new BigDecimal("300"));
            assertThatThrownBy(() -> ap.addPayment(excessivePayment))
                    .isInstanceOf(PaymentExceedsBalanceException.class)
                    .hasMessageContaining("exceeds remaining balance");
        }

        @Test
        @DisplayName("should throw when adding payment to PAID AP")
        void shouldThrowWhenAddingPaymentToPaidAp() {
            // Given
            AccountsPayable ap = createAp(new BigDecimal("1000"));
            ap.addPayment(createPayment(new BigDecimal("1000")));
            assertThat(ap.getStatus()).isEqualTo(AccountsPayableStatus.PAID);

            // When / Then
            VendorPayment additionalPayment = createPayment(new BigDecimal("100"));
            assertThatThrownBy(() -> ap.addPayment(additionalPayment))
                    .isInstanceOf(PaymentNotAllowedException.class)
                    .hasMessageContaining("PAID");
        }

        @Test
        @DisplayName("should throw when adding payment to CANCELLED AP")
        void shouldThrowWhenAddingPaymentToCancelledAp() {
            // Given
            AccountsPayable ap = createAp(new BigDecimal("1000"));
            ap.cancel();
            assertThat(ap.getStatus()).isEqualTo(AccountsPayableStatus.CANCELLED);

            // When / Then
            VendorPayment payment = createPayment(new BigDecimal("500"));
            assertThatThrownBy(() -> ap.addPayment(payment))
                    .isInstanceOf(PaymentNotAllowedException.class)
                    .hasMessageContaining("CANCELLED");
        }

        @Test
        @DisplayName("should set accountsPayable reference on payment when added")
        void shouldSetAccountsPayableReferenceOnPayment() {
            // Given
            AccountsPayable ap = createAp(new BigDecimal("1000"));
            VendorPayment payment = createPayment(new BigDecimal("500"));

            // When
            ap.addPayment(payment);

            // Then
            assertThat(payment.getAccountsPayable()).isEqualTo(ap);
        }
    }

    // ==========================================================================
    // Cancel Tests
    // ==========================================================================

    @Nested
    @DisplayName("Cancel")
    class CancelTests {

        @Test
        @DisplayName("should cancel PENDING AP without payments")
        void shouldCancelPendingApWithoutPayments() {
            // Given
            AccountsPayable ap = createAp(new BigDecimal("1000"));
            assertThat(ap.getStatus()).isEqualTo(AccountsPayableStatus.PENDING);

            // When
            ap.cancel();

            // Then
            assertThat(ap.getStatus()).isEqualTo(AccountsPayableStatus.CANCELLED);
        }

        @Test
        @DisplayName("should throw when cancelling AP with payments")
        void shouldThrowWhenCancellingApWithPayments() {
            // Given
            AccountsPayable ap = createAp(new BigDecimal("1000"));
            ap.addPayment(createPayment(new BigDecimal("500")));

            // When / Then
            assertThatThrownBy(() -> ap.cancel())
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("existing payments");
        }

        @Test
        @DisplayName("should throw when cancelling PAID AP")
        void shouldThrowWhenCancellingPaidAp() {
            // Given
            AccountsPayable ap = createAp(new BigDecimal("1000"));
            ap.addPayment(createPayment(new BigDecimal("1000")));
            assertThat(ap.getStatus()).isEqualTo(AccountsPayableStatus.PAID);

            // When / Then
            assertThatThrownBy(() -> ap.cancel())
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("fully paid");
        }

        @Test
        @DisplayName("should throw when cancelling already CANCELLED AP")
        void shouldThrowWhenCancellingAlreadyCancelledAp() {
            // Given
            AccountsPayable ap = createAp(new BigDecimal("1000"));
            ap.cancel();

            // When / Then
            assertThatThrownBy(() -> ap.cancel())
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("already cancelled");
        }
    }

    // ==========================================================================
    // Overdue Detection Tests
    // ==========================================================================

    @Nested
    @DisplayName("Overdue Detection")
    class OverdueDetectionTests {

        @Test
        @DisplayName("should not be overdue when no due date is set")
        void shouldNotBeOverdueWhenNoDueDateSet() {
            AccountsPayable ap = createAp(new BigDecimal("1000"));
            assertThat(ap.getDueDate()).isNull();
            assertThat(ap.isOverdue()).isFalse();
        }

        @Test
        @DisplayName("should not be overdue when due date is in the future")
        void shouldNotBeOverdueWhenDueDateIsInFuture() {
            AccountsPayable ap = createApWithDueDate(
                    new BigDecimal("1000"),
                    LocalDate.now().plusDays(30)
            );
            assertThat(ap.isOverdue()).isFalse();
        }

        @Test
        @DisplayName("should not be overdue when due date is today")
        void shouldNotBeOverdueWhenDueDateIsToday() {
            AccountsPayable ap = createApWithDueDate(
                    new BigDecimal("1000"),
                    LocalDate.now()
            );
            assertThat(ap.isOverdue()).isFalse();
        }

        @Test
        @DisplayName("should be overdue when past due date with remaining balance")
        void shouldBeOverdueWhenPastDueDateWithRemainingBalance() {
            AccountsPayable ap = createApWithDueDate(
                    new BigDecimal("1000"),
                    LocalDate.now().minusDays(1)
            );
            assertThat(ap.isOverdue()).isTrue();
        }

        @Test
        @DisplayName("should not be overdue when past due date but fully paid")
        void shouldNotBeOverdueWhenPastDueDateButFullyPaid() {
            AccountsPayable ap = createApWithDueDate(
                    new BigDecimal("1000"),
                    LocalDate.now().minusDays(30)
            );
            ap.addPayment(createPayment(new BigDecimal("1000")));

            assertThat(ap.isFullyPaid()).isTrue();
            assertThat(ap.isOverdue()).isFalse();
        }
    }

    // ==========================================================================
    // Aging Bucket Tests
    // ==========================================================================

    @Nested
    @DisplayName("Aging Bucket Calculation")
    class AgingBucketTests {

        @Test
        @DisplayName("should return 'Current' when no due date")
        void shouldReturnCurrentWhenNoDueDate() {
            AccountsPayable ap = createAp(new BigDecimal("1000"));
            assertThat(ap.getAgingBucket()).isEqualTo("Current");
        }

        @Test
        @DisplayName("should return 'Current' when not overdue")
        void shouldReturnCurrentWhenNotOverdue() {
            AccountsPayable ap = createApWithDueDate(
                    new BigDecimal("1000"),
                    LocalDate.now().plusDays(10)
            );
            assertThat(ap.getAgingBucket()).isEqualTo("Current");
        }

        @Test
        @DisplayName("should return '30 Days' when 1-30 days overdue")
        void shouldReturn30DaysWhen1To30DaysOverdue() {
            AccountsPayable ap = createApWithDueDate(
                    new BigDecimal("1000"),
                    LocalDate.now().minusDays(15)
            );
            assertThat(ap.getAgingBucket()).isEqualTo("30 Days");
        }

        @Test
        @DisplayName("should return '60 Days' when 31-60 days overdue")
        void shouldReturn60DaysWhen31To60DaysOverdue() {
            AccountsPayable ap = createApWithDueDate(
                    new BigDecimal("1000"),
                    LocalDate.now().minusDays(45)
            );
            assertThat(ap.getAgingBucket()).isEqualTo("60 Days");
        }

        @Test
        @DisplayName("should return '90+ Days' when over 60 days overdue")
        void shouldReturn90PlusDaysWhenOver60DaysOverdue() {
            AccountsPayable ap = createApWithDueDate(
                    new BigDecimal("1000"),
                    LocalDate.now().minusDays(91)
            );
            assertThat(ap.getAgingBucket()).isEqualTo("90+ Days");
        }

        @Test
        @DisplayName("should return 'Current' when overdue but fully paid")
        void shouldReturnCurrentWhenOverdueButFullyPaid() {
            AccountsPayable ap = createApWithDueDate(
                    new BigDecimal("1000"),
                    LocalDate.now().minusDays(45)
            );
            ap.addPayment(createPayment(new BigDecimal("1000")));

            assertThat(ap.getAgingBucket()).isEqualTo("Current");
        }
    }

    // ==========================================================================
    // Getter Tests
    // ==========================================================================

    @Nested
    @DisplayName("Getters")
    class GetterTests {

        @Test
        @DisplayName("should return cause type from disbursement cause")
        void shouldReturnCauseTypeFromDisbursementCause() {
            AccountsPayable ap = createAp(new BigDecimal("1000"));
            assertThat(ap.getCauseType()).isNotNull();
        }

        @Test
        @DisplayName("should return cause ID from disbursement cause")
        void shouldReturnCauseIdFromDisbursementCause() {
            AccountsPayable ap = createAp(new BigDecimal("1000"));
            assertThat(ap.getCauseId()).isEqualTo(1L);
        }

        @Test
        @DisplayName("should return cause reference number from disbursement cause")
        void shouldReturnCauseReferenceNumberFromDisbursementCause() {
            AccountsPayable ap = createAp(new BigDecimal("1000"));
            assertThat(ap.getCauseReferenceNumber()).isEqualTo("PO-2025-000001");
        }

        @Test
        @DisplayName("should return unmodifiable payments list")
        void shouldReturnUnmodifiablePaymentsList() {
            AccountsPayable ap = createAp(new BigDecimal("1000"));
            ap.addPayment(createPayment(new BigDecimal("500")));

            assertThatThrownBy(() -> ap.getPayments().add(createPayment(new BigDecimal("100"))))
                    .isInstanceOf(UnsupportedOperationException.class);
        }
    }
}
