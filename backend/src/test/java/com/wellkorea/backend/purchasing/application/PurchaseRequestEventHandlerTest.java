package com.wellkorea.backend.purchasing.application;

import com.wellkorea.backend.purchasing.domain.PurchaseRequest;
import com.wellkorea.backend.purchasing.domain.event.PurchaseOrderCanceledEvent;
import com.wellkorea.backend.purchasing.domain.event.PurchaseOrderCreatedEvent;
import com.wellkorea.backend.purchasing.domain.event.PurchaseOrderReceivedEvent;
import com.wellkorea.backend.purchasing.domain.vo.PurchaseRequestStatus;
import com.wellkorea.backend.purchasing.infrastructure.persistence.PurchaseRequestRepository;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for PurchaseRequestEventHandler.
 * Tests event handling logic for PO lifecycle events.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("PurchaseRequestEventHandler Unit Tests")
class PurchaseRequestEventHandlerTest {

    @Mock
    private PurchaseRequestRepository purchaseRequestRepository;

    @Mock
    private PurchaseRequest purchaseRequest;

    @InjectMocks
    private PurchaseRequestEventHandler eventHandler;

    // ==========================================================================
    // onPurchaseOrderCreated Tests
    // ==========================================================================

    @Nested
    @DisplayName("onPurchaseOrderCreated")
    class OnPurchaseOrderCreatedTests {

        private PurchaseOrderCreatedEvent event;

        @BeforeEach
        void setUp() {
            event = new PurchaseOrderCreatedEvent(1L, 100L, "PO-2025-000001");
        }

        @Test
        @DisplayName("should mark PurchaseRequest as ordered when in VENDOR_SELECTED status")
        void shouldMarkOrdered_WhenVendorSelected() {
            // Given
            when(purchaseRequestRepository.findById(100L)).thenReturn(Optional.of(purchaseRequest));
            when(purchaseRequest.getStatus()).thenReturn(PurchaseRequestStatus.VENDOR_SELECTED);

            // When
            eventHandler.onPurchaseOrderCreated(event);

            // Then
            verify(purchaseRequest).markOrdered();
            verify(purchaseRequestRepository).save(purchaseRequest);
        }

        @Test
        @DisplayName("should skip marking ordered when PurchaseRequest not in VENDOR_SELECTED status")
        void shouldSkipMarkOrdered_WhenNotVendorSelected() {
            // Given
            when(purchaseRequestRepository.findById(100L)).thenReturn(Optional.of(purchaseRequest));
            when(purchaseRequest.getStatus()).thenReturn(PurchaseRequestStatus.ORDERED);

            // When
            eventHandler.onPurchaseOrderCreated(event);

            // Then
            verify(purchaseRequest, never()).markOrdered();
            verify(purchaseRequestRepository, never()).save(any());
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException when PurchaseRequest not found")
        void shouldThrowException_WhenPurchaseRequestNotFound() {
            // Given
            when(purchaseRequestRepository.findById(100L)).thenReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> eventHandler.onPurchaseOrderCreated(event))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("100");
        }
    }

    // ==========================================================================
    // onPurchaseOrderReceived Tests
    // ==========================================================================

    @Nested
    @DisplayName("onPurchaseOrderReceived")
    class OnPurchaseOrderReceivedTests {

        private PurchaseOrderReceivedEvent event;

        @BeforeEach
        void setUp() {
            event = new PurchaseOrderReceivedEvent(1L, 100L, "PO-2025-000001");
        }

        @Test
        @DisplayName("should close PurchaseRequest when in ORDERED status")
        void shouldClosePurchaseRequest_WhenOrdered() {
            // Given
            when(purchaseRequestRepository.findById(100L)).thenReturn(Optional.of(purchaseRequest));
            when(purchaseRequest.getStatus()).thenReturn(PurchaseRequestStatus.ORDERED);

            // When
            eventHandler.onPurchaseOrderReceived(event);

            // Then
            verify(purchaseRequest).close();
            verify(purchaseRequestRepository).save(purchaseRequest);
        }

        @Test
        @DisplayName("should skip closing when PurchaseRequest not in ORDERED status")
        void shouldSkipClose_WhenNotOrdered() {
            // Given
            when(purchaseRequestRepository.findById(100L)).thenReturn(Optional.of(purchaseRequest));
            when(purchaseRequest.getStatus()).thenReturn(PurchaseRequestStatus.CLOSED);

            // When
            eventHandler.onPurchaseOrderReceived(event);

            // Then
            verify(purchaseRequest, never()).close();
            verify(purchaseRequestRepository, never()).save(any());
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException when PurchaseRequest not found")
        void shouldThrowException_WhenPurchaseRequestNotFound() {
            // Given
            when(purchaseRequestRepository.findById(100L)).thenReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> eventHandler.onPurchaseOrderReceived(event))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("100");
        }
    }

    // ==========================================================================
    // onPurchaseOrderCanceled Tests
    // ==========================================================================

    @Nested
    @DisplayName("onPurchaseOrderCanceled")
    class OnPurchaseOrderCanceledTests {

        private PurchaseOrderCanceledEvent event;

        @BeforeEach
        void setUp() {
            event = new PurchaseOrderCanceledEvent(1L, 100L, "rfq-item-1", "PO-2025-000001");
        }

        @Test
        @DisplayName("should revert vendor selection when in VENDOR_SELECTED status")
        void shouldRevertVendorSelection_WhenVendorSelected() {
            // Given
            when(purchaseRequestRepository.findById(100L)).thenReturn(Optional.of(purchaseRequest));
            when(purchaseRequest.getStatus()).thenReturn(PurchaseRequestStatus.VENDOR_SELECTED);

            // When
            eventHandler.onPurchaseOrderCanceled(event);

            // Then
            verify(purchaseRequest).revertVendorSelection("rfq-item-1");
            verify(purchaseRequestRepository).save(purchaseRequest);
        }

        @Test
        @DisplayName("should revert vendor selection when in ORDERED status")
        void shouldRevertVendorSelection_WhenOrdered() {
            // Given
            when(purchaseRequestRepository.findById(100L)).thenReturn(Optional.of(purchaseRequest));
            when(purchaseRequest.getStatus()).thenReturn(PurchaseRequestStatus.ORDERED);

            // When
            eventHandler.onPurchaseOrderCanceled(event);

            // Then
            verify(purchaseRequest).revertVendorSelection("rfq-item-1");
            verify(purchaseRequestRepository).save(purchaseRequest);
        }

        @Test
        @DisplayName("should skip revert when PurchaseRequest not in VENDOR_SELECTED or ORDERED status")
        void shouldSkipRevert_WhenNotVendorSelectedOrOrdered() {
            // Given
            when(purchaseRequestRepository.findById(100L)).thenReturn(Optional.of(purchaseRequest));
            when(purchaseRequest.getStatus()).thenReturn(PurchaseRequestStatus.RFQ_SENT);

            // When
            eventHandler.onPurchaseOrderCanceled(event);

            // Then
            verify(purchaseRequest, never()).revertVendorSelection(anyString());
            verify(purchaseRequestRepository, never()).save(any());
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException when PurchaseRequest not found")
        void shouldThrowException_WhenPurchaseRequestNotFound() {
            // Given
            when(purchaseRequestRepository.findById(100L)).thenReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> eventHandler.onPurchaseOrderCanceled(event))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("100");
        }
    }
}
