package com.wellkorea.backend.finance.application;

import com.wellkorea.backend.company.domain.Company;
import com.wellkorea.backend.company.infrastructure.persistence.CompanyRepository;
import com.wellkorea.backend.finance.domain.AccountsPayable;
import com.wellkorea.backend.finance.domain.vo.DisbursementCauseType;
import com.wellkorea.backend.finance.infrastructure.persistence.AccountsPayableRepository;
import com.wellkorea.backend.purchasing.domain.event.PurchaseOrderConfirmedEvent;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for AccountsPayableEventHandler.
 * Tests event handling logic for PO confirmed events.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AccountsPayableEventHandler Unit Tests")
class AccountsPayableEventHandlerTest {

    @Mock
    private AccountsPayableRepository accountsPayableRepository;

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private Company vendor;

    @InjectMocks
    private AccountsPayableEventHandler eventHandler;

    // ==========================================================================
    // onPurchaseOrderConfirmed Tests
    // ==========================================================================

    @Nested
    @DisplayName("onPurchaseOrderConfirmed")
    class OnPurchaseOrderConfirmedTests {

        private PurchaseOrderConfirmedEvent event;

        @BeforeEach
        void setUp() {
            event = new PurchaseOrderConfirmedEvent(
                    1L,                          // purchaseOrderId
                    100L,                        // vendorId
                    "PO-2025-000001",           // poNumber
                    new BigDecimal("50000"),    // totalAmount
                    "KRW"                       // currency
            );
        }

        @Test
        @DisplayName("should create AccountsPayable when PO confirmed event is received")
        void shouldCreateAccountsPayable_WhenPoConfirmed() {
            // Given
            when(companyRepository.findById(100L)).thenReturn(Optional.of(vendor));

            // When
            eventHandler.onPurchaseOrderConfirmed(event);

            // Then
            ArgumentCaptor<AccountsPayable> apCaptor = ArgumentCaptor.forClass(AccountsPayable.class);
            verify(accountsPayableRepository).save(apCaptor.capture());

            AccountsPayable savedAp = apCaptor.getValue();
            assertThat(savedAp.getCauseType()).isEqualTo(DisbursementCauseType.PURCHASE_ORDER);
            assertThat(savedAp.getCauseId()).isEqualTo(1L);
            assertThat(savedAp.getCauseReferenceNumber()).isEqualTo("PO-2025-000001");
            assertThat(savedAp.getVendor()).isEqualTo(vendor);
            assertThat(savedAp.getTotalAmount()).isEqualByComparingTo(new BigDecimal("50000"));
            assertThat(savedAp.getCurrency()).isEqualTo("KRW");
        }

        @Test
        @DisplayName("should handle duplicate gracefully when AP already exists (idempotency via unique constraint)")
        void shouldHandleDuplicateGracefully_WhenApAlreadyExists() {
            // Given
            when(companyRepository.findById(100L)).thenReturn(Optional.of(vendor));
            when(accountsPayableRepository.save(any(AccountsPayable.class)))
                    .thenThrow(new DataIntegrityViolationException("Duplicate entry for cause_type/cause_id"));

            // When - should NOT throw, just log and continue
            eventHandler.onPurchaseOrderConfirmed(event);

            // Then - save was attempted, exception was caught and handled
            verify(accountsPayableRepository).save(any(AccountsPayable.class));
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException when vendor not found")
        void shouldThrowException_WhenVendorNotFound() {
            // Given
            when(companyRepository.findById(100L)).thenReturn(Optional.empty());

            // When / Then
            assertThatThrownBy(() -> eventHandler.onPurchaseOrderConfirmed(event))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("100");
        }

        @Test
        @DisplayName("should use currency from event")
        void shouldUseCurrencyFromEvent() {
            // Given
            PurchaseOrderConfirmedEvent usdEvent = new PurchaseOrderConfirmedEvent(
                    2L, 100L, "PO-2025-000002", new BigDecimal("1000"), "USD"
            );

            when(companyRepository.findById(100L)).thenReturn(Optional.of(vendor));

            // When
            eventHandler.onPurchaseOrderConfirmed(usdEvent);

            // Then
            ArgumentCaptor<AccountsPayable> apCaptor = ArgumentCaptor.forClass(AccountsPayable.class);
            verify(accountsPayableRepository).save(apCaptor.capture());
            assertThat(apCaptor.getValue().getCurrency()).isEqualTo("USD");
        }
    }
}
