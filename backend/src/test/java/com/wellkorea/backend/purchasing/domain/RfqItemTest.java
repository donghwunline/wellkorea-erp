package com.wellkorea.backend.purchasing.domain;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Unit tests for RfqItem state machine.
 *
 * State Diagram:
 * <pre>
 *     [*] --> SENT
 *     SENT --> REPLIED (recordReply)
 *     SENT --> NO_RESPONSE (markNoResponse)
 *     REPLIED --> SELECTED (select)
 *     REPLIED --> REJECTED (reject)
 *     SELECTED --> REPLIED (deselect)
 *     REJECTED --> REPLIED (unreject)
 * </pre>
 *
 * @see RfqItem
 * @see RfqItemStatus
 */
@Tag("unit")
@DisplayName("RfqItem State Machine")
class RfqItemTest {

    private RfqItem rfqItem;

    @BeforeEach
    void setUp() {
        rfqItem = new RfqItem(1L, null);
    }

    @Nested
    @DisplayName("Initial State")
    class InitialState {

        @Test
        @DisplayName("should start in SENT status")
        void shouldStartInSentStatus() {
            // When
            RfqItem newItem = new RfqItem(1L, 100L);

            // Then
            assertThat(newItem.getStatus()).isEqualTo(RfqItemStatus.SENT);
            assertThat(newItem.getItemId()).isNotNull();
            assertThat(newItem.getVendorCompanyId()).isEqualTo(1L);
            assertThat(newItem.getVendorOfferingId()).isEqualTo(100L);
            assertThat(newItem.getSentAt()).isNotNull();
        }

        @Test
        @DisplayName("should allow null vendorOfferingId")
        void shouldAllowNullVendorOfferingId() {
            // When
            RfqItem newItem = new RfqItem(1L, null);

            // Then
            assertThat(newItem.getVendorOfferingId()).isNull();
        }
    }

    @Nested
    @DisplayName("SENT → REPLIED transition (recordReply)")
    class RecordReplyTransition {

        @Test
        @DisplayName("should transition from SENT to REPLIED")
        void shouldTransitionFromSentToReplied() {
            // Given
            assertThat(rfqItem.getStatus()).isEqualTo(RfqItemStatus.SENT);

            // When
            rfqItem.recordReply(new BigDecimal("1000.00"), 7, "Good quality");

            // Then
            assertThat(rfqItem.getStatus()).isEqualTo(RfqItemStatus.REPLIED);
            assertThat(rfqItem.getQuotedPrice()).isEqualByComparingTo("1000.00");
            assertThat(rfqItem.getQuotedLeadTime()).isEqualTo(7);
            assertThat(rfqItem.getNotes()).isEqualTo("Good quality");
            assertThat(rfqItem.getRepliedAt()).isNotNull();
        }

        @Test
        @DisplayName("should throw when recording reply from REPLIED status")
        void shouldThrowWhenRecordingReplyFromReplied() {
            // Given
            rfqItem.recordReply(new BigDecimal("1000.00"), 7, null);

            // When / Then
            assertThatThrownBy(() -> rfqItem.recordReply(new BigDecimal("2000.00"), 14, null))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Cannot record reply")
                    .hasMessageContaining("REPLIED");
        }

        @Test
        @DisplayName("should throw when recording reply from NO_RESPONSE status")
        void shouldThrowWhenRecordingReplyFromNoResponse() {
            // Given
            rfqItem.markNoResponse();

            // When / Then
            assertThatThrownBy(() -> rfqItem.recordReply(new BigDecimal("1000.00"), 7, null))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Cannot record reply")
                    .hasMessageContaining("NO_RESPONSE");
        }
    }

    @Nested
    @DisplayName("SENT → NO_RESPONSE transition (markNoResponse)")
    class MarkNoResponseTransition {

        @Test
        @DisplayName("should transition from SENT to NO_RESPONSE")
        void shouldTransitionFromSentToNoResponse() {
            // Given
            assertThat(rfqItem.getStatus()).isEqualTo(RfqItemStatus.SENT);

            // When
            rfqItem.markNoResponse();

            // Then
            assertThat(rfqItem.getStatus()).isEqualTo(RfqItemStatus.NO_RESPONSE);
        }

        @Test
        @DisplayName("should throw when marking no response from REPLIED status")
        void shouldThrowWhenMarkingNoResponseFromReplied() {
            // Given
            rfqItem.recordReply(new BigDecimal("1000.00"), 7, null);

            // When / Then
            assertThatThrownBy(() -> rfqItem.markNoResponse())
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Cannot mark no response")
                    .hasMessageContaining("REPLIED");
        }
    }

    @Nested
    @DisplayName("REPLIED → SELECTED transition (select)")
    class SelectTransition {

        @BeforeEach
        void setUpRepliedState() {
            rfqItem.recordReply(new BigDecimal("1000.00"), 7, null);
        }

        @Test
        @DisplayName("should transition from REPLIED to SELECTED")
        void shouldTransitionFromRepliedToSelected() {
            // Given
            assertThat(rfqItem.getStatus()).isEqualTo(RfqItemStatus.REPLIED);

            // When
            rfqItem.select();

            // Then
            assertThat(rfqItem.getStatus()).isEqualTo(RfqItemStatus.SELECTED);
        }

        @Test
        @DisplayName("should throw when selecting from SENT status")
        void shouldThrowWhenSelectingFromSent() {
            // Given
            RfqItem sentItem = new RfqItem(1L, null);

            // When / Then
            assertThatThrownBy(() -> sentItem.select())
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Cannot select")
                    .hasMessageContaining("SENT");
        }

        @Test
        @DisplayName("should throw when selecting from REJECTED status")
        void shouldThrowWhenSelectingFromRejected() {
            // Given
            rfqItem.reject();

            // When / Then
            assertThatThrownBy(() -> rfqItem.select())
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Cannot select")
                    .hasMessageContaining("REJECTED");
        }
    }

    @Nested
    @DisplayName("REPLIED → REJECTED transition (reject)")
    class RejectTransition {

        @BeforeEach
        void setUpRepliedState() {
            rfqItem.recordReply(new BigDecimal("1000.00"), 7, null);
        }

        @Test
        @DisplayName("should transition from REPLIED to REJECTED")
        void shouldTransitionFromRepliedToRejected() {
            // Given
            assertThat(rfqItem.getStatus()).isEqualTo(RfqItemStatus.REPLIED);

            // When
            rfqItem.reject();

            // Then
            assertThat(rfqItem.getStatus()).isEqualTo(RfqItemStatus.REJECTED);
        }

        @Test
        @DisplayName("should throw when rejecting from SENT status")
        void shouldThrowWhenRejectingFromSent() {
            // Given
            RfqItem sentItem = new RfqItem(1L, null);

            // When / Then
            assertThatThrownBy(() -> sentItem.reject())
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Cannot reject")
                    .hasMessageContaining("SENT");
        }

        @Test
        @DisplayName("should throw when rejecting from SELECTED status")
        void shouldThrowWhenRejectingFromSelected() {
            // Given
            rfqItem.select();

            // When / Then
            assertThatThrownBy(() -> rfqItem.reject())
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Cannot reject")
                    .hasMessageContaining("SELECTED");
        }
    }

    @Nested
    @DisplayName("SELECTED → REPLIED transition (deselect)")
    class DeselectTransition {

        @BeforeEach
        void setUpSelectedState() {
            rfqItem.recordReply(new BigDecimal("1000.00"), 7, null);
            rfqItem.select();
        }

        @Test
        @DisplayName("should transition from SELECTED to REPLIED")
        void shouldTransitionFromSelectedToReplied() {
            // Given
            assertThat(rfqItem.getStatus()).isEqualTo(RfqItemStatus.SELECTED);

            // When
            rfqItem.deselect();

            // Then
            assertThat(rfqItem.getStatus()).isEqualTo(RfqItemStatus.REPLIED);
        }

        @Test
        @DisplayName("should preserve quote data after deselect")
        void shouldPreserveQuoteDataAfterDeselect() {
            // When
            rfqItem.deselect();

            // Then
            assertThat(rfqItem.getQuotedPrice()).isEqualByComparingTo("1000.00");
            assertThat(rfqItem.getQuotedLeadTime()).isEqualTo(7);
        }

        @Test
        @DisplayName("should throw when deselecting from REPLIED status")
        void shouldThrowWhenDeselectingFromReplied() {
            // Given
            rfqItem.deselect(); // Now in REPLIED

            // When / Then
            assertThatThrownBy(() -> rfqItem.deselect())
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Cannot deselect")
                    .hasMessageContaining("REPLIED");
        }

        @Test
        @DisplayName("should throw when deselecting from REJECTED status")
        void shouldThrowWhenDeselectingFromRejected() {
            // Given
            RfqItem rejectedItem = new RfqItem(1L, null);
            rejectedItem.recordReply(new BigDecimal("1000.00"), 7, null);
            rejectedItem.reject();

            // When / Then
            assertThatThrownBy(() -> rejectedItem.deselect())
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Cannot deselect")
                    .hasMessageContaining("REJECTED");
        }
    }

    @Nested
    @DisplayName("REJECTED → REPLIED transition (unreject)")
    class UnrejectTransition {

        @BeforeEach
        void setUpRejectedState() {
            rfqItem.recordReply(new BigDecimal("1000.00"), 7, null);
            rfqItem.reject();
        }

        @Test
        @DisplayName("should transition from REJECTED to REPLIED")
        void shouldTransitionFromRejectedToReplied() {
            // Given
            assertThat(rfqItem.getStatus()).isEqualTo(RfqItemStatus.REJECTED);

            // When
            rfqItem.unreject();

            // Then
            assertThat(rfqItem.getStatus()).isEqualTo(RfqItemStatus.REPLIED);
        }

        @Test
        @DisplayName("should preserve quote data after unreject")
        void shouldPreserveQuoteDataAfterUnreject() {
            // When
            rfqItem.unreject();

            // Then
            assertThat(rfqItem.getQuotedPrice()).isEqualByComparingTo("1000.00");
            assertThat(rfqItem.getQuotedLeadTime()).isEqualTo(7);
        }

        @Test
        @DisplayName("should throw when unrejecting from REPLIED status")
        void shouldThrowWhenUnrejectingFromReplied() {
            // Given
            rfqItem.unreject(); // Now in REPLIED

            // When / Then
            assertThatThrownBy(() -> rfqItem.unreject())
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Cannot unreject")
                    .hasMessageContaining("REPLIED");
        }

        @Test
        @DisplayName("should throw when unrejecting from SELECTED status")
        void shouldThrowWhenUnrejectingFromSelected() {
            // Given
            RfqItem selectedItem = new RfqItem(1L, null);
            selectedItem.recordReply(new BigDecimal("1000.00"), 7, null);
            selectedItem.select();

            // When / Then
            assertThatThrownBy(() -> selectedItem.unreject())
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Cannot unreject")
                    .hasMessageContaining("SELECTED");
        }

        @Test
        @DisplayName("should throw when unrejecting from SENT status")
        void shouldThrowWhenUnrejectingFromSent() {
            // Given
            RfqItem sentItem = new RfqItem(1L, null);

            // When / Then
            assertThatThrownBy(() -> sentItem.unreject())
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Cannot unreject")
                    .hasMessageContaining("SENT");
        }
    }

    @Nested
    @DisplayName("NO_RESPONSE terminal state")
    class NoResponseTerminalState {

        @BeforeEach
        void setUpNoResponseState() {
            rfqItem.markNoResponse();
        }

        @Test
        @DisplayName("should not allow any transitions from NO_RESPONSE")
        void shouldNotAllowAnyTransitionsFromNoResponse() {
            // Then - all transitions should fail
            assertThatThrownBy(() -> rfqItem.recordReply(new BigDecimal("1000.00"), 7, null))
                    .isInstanceOf(IllegalStateException.class);

            assertThatThrownBy(() -> rfqItem.markNoResponse())
                    .isInstanceOf(IllegalStateException.class);

            assertThatThrownBy(() -> rfqItem.select())
                    .isInstanceOf(IllegalStateException.class);

            assertThatThrownBy(() -> rfqItem.reject())
                    .isInstanceOf(IllegalStateException.class);

            assertThatThrownBy(() -> rfqItem.deselect())
                    .isInstanceOf(IllegalStateException.class);

            assertThatThrownBy(() -> rfqItem.unreject())
                    .isInstanceOf(IllegalStateException.class);
        }
    }

    @Nested
    @DisplayName("Full Workflow Scenarios")
    class FullWorkflowScenarios {

        @Test
        @DisplayName("Happy path: SENT → REPLIED → SELECTED")
        void happyPathSentRepliedSelected() {
            // Given
            RfqItem item = new RfqItem(1L, 100L);
            assertThat(item.getStatus()).isEqualTo(RfqItemStatus.SENT);

            // When - vendor replies
            item.recordReply(new BigDecimal("5000.00"), 14, "Best price");
            assertThat(item.getStatus()).isEqualTo(RfqItemStatus.REPLIED);

            // When - user selects
            item.select();

            // Then
            assertThat(item.getStatus()).isEqualTo(RfqItemStatus.SELECTED);
        }

        @Test
        @DisplayName("Revert path: SELECTED → REPLIED → can select again")
        void revertPathSelectedToRepliedCanSelectAgain() {
            // Given - item is selected
            rfqItem.recordReply(new BigDecimal("1000.00"), 7, null);
            rfqItem.select();
            assertThat(rfqItem.getStatus()).isEqualTo(RfqItemStatus.SELECTED);

            // When - PO canceled, deselect
            rfqItem.deselect();

            // Then - can be selected again
            assertThat(rfqItem.getStatus()).isEqualTo(RfqItemStatus.REPLIED);
            rfqItem.select();
            assertThat(rfqItem.getStatus()).isEqualTo(RfqItemStatus.SELECTED);
        }

        @Test
        @DisplayName("Revert path: REJECTED → REPLIED → can select")
        void revertPathRejectedToRepliedCanSelect() {
            // Given - item is rejected
            rfqItem.recordReply(new BigDecimal("1000.00"), 7, null);
            rfqItem.reject();
            assertThat(rfqItem.getStatus()).isEqualTo(RfqItemStatus.REJECTED);

            // When - PO canceled, unreject
            rfqItem.unreject();

            // Then - can now be selected
            assertThat(rfqItem.getStatus()).isEqualTo(RfqItemStatus.REPLIED);
            rfqItem.select();
            assertThat(rfqItem.getStatus()).isEqualTo(RfqItemStatus.SELECTED);
        }
    }
}
