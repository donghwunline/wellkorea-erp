package com.wellkorea.backend.core.purchasing.domain.vo;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for PurchaseRequestStatus state transition rules.
 */
@Tag("unit")
@DisplayName("PurchaseRequestStatus")
class PurchaseRequestStatusTest {

    @Nested
    @DisplayName("canTransitionTo")
    class CanTransitionTo {

        @Test
        @DisplayName("DRAFT can transition to RFQ_SENT")
        void draftCanTransitionToRfqSent() {
            assertThat(PurchaseRequestStatus.DRAFT.canTransitionTo(PurchaseRequestStatus.RFQ_SENT)).isTrue();
        }

        @Test
        @DisplayName("DRAFT can transition to CANCELED")
        void draftCanTransitionToCanceled() {
            assertThat(PurchaseRequestStatus.DRAFT.canTransitionTo(PurchaseRequestStatus.CANCELED)).isTrue();
        }

        @Test
        @DisplayName("DRAFT cannot transition to other states")
        void draftCannotTransitionToOtherStates() {
            assertThat(PurchaseRequestStatus.DRAFT.canTransitionTo(PurchaseRequestStatus.VENDOR_SELECTED)).isFalse();
            assertThat(PurchaseRequestStatus.DRAFT.canTransitionTo(PurchaseRequestStatus.ORDERED)).isFalse();
            assertThat(PurchaseRequestStatus.DRAFT.canTransitionTo(PurchaseRequestStatus.CLOSED)).isFalse();
        }

        @Test
        @DisplayName("RFQ_SENT can transition to RFQ_SENT (idempotent)")
        void rfqSentCanTransitionToRfqSent() {
            assertThat(PurchaseRequestStatus.RFQ_SENT.canTransitionTo(PurchaseRequestStatus.RFQ_SENT)).isTrue();
        }

        @Test
        @DisplayName("RFQ_SENT can transition to VENDOR_SELECTED")
        void rfqSentCanTransitionToVendorSelected() {
            assertThat(PurchaseRequestStatus.RFQ_SENT.canTransitionTo(PurchaseRequestStatus.VENDOR_SELECTED)).isTrue();
        }

        @Test
        @DisplayName("RFQ_SENT can transition to CANCELED")
        void rfqSentCanTransitionToCanceled() {
            assertThat(PurchaseRequestStatus.RFQ_SENT.canTransitionTo(PurchaseRequestStatus.CANCELED)).isTrue();
        }

        @Test
        @DisplayName("VENDOR_SELECTED can transition to ORDERED")
        void vendorSelectedCanTransitionToOrdered() {
            assertThat(PurchaseRequestStatus.VENDOR_SELECTED.canTransitionTo(PurchaseRequestStatus.ORDERED)).isTrue();
        }

        @Test
        @DisplayName("VENDOR_SELECTED can transition to RFQ_SENT (revert)")
        void vendorSelectedCanTransitionToRfqSent() {
            assertThat(PurchaseRequestStatus.VENDOR_SELECTED.canTransitionTo(PurchaseRequestStatus.RFQ_SENT)).isTrue();
        }

        @Test
        @DisplayName("VENDOR_SELECTED can transition to CANCELED")
        void vendorSelectedCanTransitionToCanceled() {
            assertThat(PurchaseRequestStatus.VENDOR_SELECTED.canTransitionTo(PurchaseRequestStatus.CANCELED)).isTrue();
        }

        @Test
        @DisplayName("ORDERED can transition to CLOSED")
        void orderedCanTransitionToClosed() {
            assertThat(PurchaseRequestStatus.ORDERED.canTransitionTo(PurchaseRequestStatus.CLOSED)).isTrue();
        }

        @Test
        @DisplayName("ORDERED can transition to RFQ_SENT (revert)")
        void orderedCanTransitionToRfqSent() {
            assertThat(PurchaseRequestStatus.ORDERED.canTransitionTo(PurchaseRequestStatus.RFQ_SENT)).isTrue();
        }

        @Test
        @DisplayName("ORDERED can transition to CANCELED")
        void orderedCanTransitionToCanceled() {
            assertThat(PurchaseRequestStatus.ORDERED.canTransitionTo(PurchaseRequestStatus.CANCELED)).isTrue();
        }

        @Test
        @DisplayName("CLOSED cannot transition to any state")
        void closedCannotTransitionToAnyState() {
            for (PurchaseRequestStatus status : PurchaseRequestStatus.values()) {
                assertThat(PurchaseRequestStatus.CLOSED.canTransitionTo(status)).isFalse();
            }
        }

        @Test
        @DisplayName("CANCELED cannot transition to any state")
        void canceledCannotTransitionToAnyState() {
            for (PurchaseRequestStatus status : PurchaseRequestStatus.values()) {
                assertThat(PurchaseRequestStatus.CANCELED.canTransitionTo(status)).isFalse();
            }
        }

        @Test
        @DisplayName("cannot transition to null")
        void cannotTransitionToNull() {
            for (PurchaseRequestStatus status : PurchaseRequestStatus.values()) {
                assertThat(status.canTransitionTo(null)).isFalse();
            }
        }

        @Test
        @DisplayName("cannot transition to same state (except RFQ_SENT)")
        void cannotTransitionToSameState() {
            assertThat(PurchaseRequestStatus.DRAFT.canTransitionTo(PurchaseRequestStatus.DRAFT)).isFalse();
            assertThat(PurchaseRequestStatus.RFQ_SENT.canTransitionTo(PurchaseRequestStatus.RFQ_SENT)).isTrue(); // exception
            assertThat(PurchaseRequestStatus.VENDOR_SELECTED.canTransitionTo(PurchaseRequestStatus.VENDOR_SELECTED)).isFalse();
            assertThat(PurchaseRequestStatus.ORDERED.canTransitionTo(PurchaseRequestStatus.ORDERED)).isFalse();
            assertThat(PurchaseRequestStatus.CLOSED.canTransitionTo(PurchaseRequestStatus.CLOSED)).isFalse();
            assertThat(PurchaseRequestStatus.CANCELED.canTransitionTo(PurchaseRequestStatus.CANCELED)).isFalse();
        }
    }

    @Nested
    @DisplayName("canSendRfq")
    class CanSendRfq {

        @Test
        @DisplayName("returns true for DRAFT")
        void returnsTrueForDraft() {
            assertThat(PurchaseRequestStatus.DRAFT.canSendRfq()).isTrue();
        }

        @Test
        @DisplayName("returns true for RFQ_SENT")
        void returnsTrueForRfqSent() {
            assertThat(PurchaseRequestStatus.RFQ_SENT.canSendRfq()).isTrue();
        }

        @Test
        @DisplayName("returns false for other states")
        void returnsFalseForOtherStates() {
            assertThat(PurchaseRequestStatus.VENDOR_SELECTED.canSendRfq()).isFalse();
            assertThat(PurchaseRequestStatus.ORDERED.canSendRfq()).isFalse();
            assertThat(PurchaseRequestStatus.CLOSED.canSendRfq()).isFalse();
            assertThat(PurchaseRequestStatus.CANCELED.canSendRfq()).isFalse();
        }
    }

    @Nested
    @DisplayName("canUpdate")
    class CanUpdate {

        @Test
        @DisplayName("returns true only for DRAFT")
        void returnsTrueOnlyForDraft() {
            assertThat(PurchaseRequestStatus.DRAFT.canUpdate()).isTrue();
            assertThat(PurchaseRequestStatus.RFQ_SENT.canUpdate()).isFalse();
            assertThat(PurchaseRequestStatus.VENDOR_SELECTED.canUpdate()).isFalse();
            assertThat(PurchaseRequestStatus.ORDERED.canUpdate()).isFalse();
            assertThat(PurchaseRequestStatus.CLOSED.canUpdate()).isFalse();
            assertThat(PurchaseRequestStatus.CANCELED.canUpdate()).isFalse();
        }
    }

    @Nested
    @DisplayName("canCancel")
    class CanCancel {

        @Test
        @DisplayName("returns true for non-terminal states")
        void returnsTrueForNonTerminalStates() {
            assertThat(PurchaseRequestStatus.DRAFT.canCancel()).isTrue();
            assertThat(PurchaseRequestStatus.RFQ_SENT.canCancel()).isTrue();
            assertThat(PurchaseRequestStatus.VENDOR_SELECTED.canCancel()).isTrue();
            assertThat(PurchaseRequestStatus.ORDERED.canCancel()).isTrue();
        }

        @Test
        @DisplayName("returns false for terminal states")
        void returnsFalseForTerminalStates() {
            assertThat(PurchaseRequestStatus.CLOSED.canCancel()).isFalse();
            assertThat(PurchaseRequestStatus.CANCELED.canCancel()).isFalse();
        }
    }

    @Nested
    @DisplayName("isTerminal")
    class IsTerminal {

        @Test
        @DisplayName("returns true for CLOSED and CANCELED")
        void returnsTrueForTerminalStates() {
            assertThat(PurchaseRequestStatus.CLOSED.isTerminal()).isTrue();
            assertThat(PurchaseRequestStatus.CANCELED.isTerminal()).isTrue();
        }

        @Test
        @DisplayName("returns false for non-terminal states")
        void returnsFalseForNonTerminalStates() {
            assertThat(PurchaseRequestStatus.DRAFT.isTerminal()).isFalse();
            assertThat(PurchaseRequestStatus.RFQ_SENT.isTerminal()).isFalse();
            assertThat(PurchaseRequestStatus.VENDOR_SELECTED.isTerminal()).isFalse();
            assertThat(PurchaseRequestStatus.ORDERED.isTerminal()).isFalse();
        }
    }
}
