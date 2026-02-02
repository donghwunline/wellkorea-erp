package com.wellkorea.backend.core.purchasing.domain.vo;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.EnumSource;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for RfqItemStatus state transition rules.
 * <p>
 * State diagram:
 * <pre>
 *     [*] --> SENT
 *     SENT --> REPLIED (recordReply)
 *     SENT --> NO_RESPONSE (markNoResponse) [terminal]
 *     REPLIED --> SELECTED (select)
 *     REPLIED --> REJECTED (reject)
 *     SELECTED --> REPLIED (deselect - when PO canceled)
 *     REJECTED --> REPLIED (unreject - when PO canceled)
 * </pre>
 */
@Tag("unit")
@DisplayName("RfqItemStatus State Transitions")
class RfqItemStatusTest {

    @Nested
    @DisplayName("canTransitionTo()")
    class CanTransitionTo {

        @ParameterizedTest(name = "SENT → {0} should be {1}")
        @CsvSource({
                "SENT, false",
                "REPLIED, true",
                "NO_RESPONSE, true",
                "SELECTED, false",
                "REJECTED, false"
        })
        @DisplayName("SENT transitions")
        void sentTransitions(RfqItemStatus target, boolean expected) {
            assertThat(RfqItemStatus.SENT.canTransitionTo(target)).isEqualTo(expected);
        }

        @ParameterizedTest(name = "REPLIED → {0} should be {1}")
        @CsvSource({
                "SENT, false",
                "REPLIED, false",
                "NO_RESPONSE, false",
                "SELECTED, true",
                "REJECTED, true"
        })
        @DisplayName("REPLIED transitions")
        void repliedTransitions(RfqItemStatus target, boolean expected) {
            assertThat(RfqItemStatus.REPLIED.canTransitionTo(target)).isEqualTo(expected);
        }

        @ParameterizedTest(name = "SELECTED → {0} should be {1}")
        @CsvSource({
                "SENT, false",
                "REPLIED, true",
                "NO_RESPONSE, false",
                "SELECTED, false",
                "REJECTED, false"
        })
        @DisplayName("SELECTED transitions (deselect reverts to REPLIED)")
        void selectedTransitions(RfqItemStatus target, boolean expected) {
            assertThat(RfqItemStatus.SELECTED.canTransitionTo(target)).isEqualTo(expected);
        }

        @ParameterizedTest(name = "REJECTED → {0} should be {1}")
        @CsvSource({
                "SENT, false",
                "REPLIED, true",
                "NO_RESPONSE, false",
                "SELECTED, false",
                "REJECTED, false"
        })
        @DisplayName("REJECTED transitions (unreject reverts to REPLIED)")
        void rejectedTransitions(RfqItemStatus target, boolean expected) {
            assertThat(RfqItemStatus.REJECTED.canTransitionTo(target)).isEqualTo(expected);
        }

        @ParameterizedTest(name = "NO_RESPONSE → {0} should be false")
        @EnumSource(RfqItemStatus.class)
        @DisplayName("NO_RESPONSE is terminal - no transitions allowed")
        void noResponseIsTerminal(RfqItemStatus target) {
            assertThat(RfqItemStatus.NO_RESPONSE.canTransitionTo(target)).isFalse();
        }

        @Test
        @DisplayName("should return false when target is null")
        void shouldReturnFalseWhenTargetIsNull() {
            for (RfqItemStatus status : RfqItemStatus.values()) {
                assertThat(status.canTransitionTo(null)).isFalse();
            }
        }
    }

    @Nested
    @DisplayName("Guard Methods")
    class GuardMethods {

        @Test
        @DisplayName("canRecordReply() - only SENT")
        void canRecordReply() {
            assertThat(RfqItemStatus.SENT.canRecordReply()).isTrue();
            assertThat(RfqItemStatus.REPLIED.canRecordReply()).isFalse();
            assertThat(RfqItemStatus.SELECTED.canRecordReply()).isFalse();
            assertThat(RfqItemStatus.REJECTED.canRecordReply()).isFalse();
            assertThat(RfqItemStatus.NO_RESPONSE.canRecordReply()).isFalse();
        }

        @Test
        @DisplayName("canMarkNoResponse() - only SENT")
        void canMarkNoResponse() {
            assertThat(RfqItemStatus.SENT.canMarkNoResponse()).isTrue();
            assertThat(RfqItemStatus.REPLIED.canMarkNoResponse()).isFalse();
            assertThat(RfqItemStatus.SELECTED.canMarkNoResponse()).isFalse();
            assertThat(RfqItemStatus.REJECTED.canMarkNoResponse()).isFalse();
            assertThat(RfqItemStatus.NO_RESPONSE.canMarkNoResponse()).isFalse();
        }

        @Test
        @DisplayName("canSelect() - only REPLIED")
        void canSelect() {
            assertThat(RfqItemStatus.SENT.canSelect()).isFalse();
            assertThat(RfqItemStatus.REPLIED.canSelect()).isTrue();
            assertThat(RfqItemStatus.SELECTED.canSelect()).isFalse();
            assertThat(RfqItemStatus.REJECTED.canSelect()).isFalse();
            assertThat(RfqItemStatus.NO_RESPONSE.canSelect()).isFalse();
        }

        @Test
        @DisplayName("canReject() - only REPLIED")
        void canReject() {
            assertThat(RfqItemStatus.SENT.canReject()).isFalse();
            assertThat(RfqItemStatus.REPLIED.canReject()).isTrue();
            assertThat(RfqItemStatus.SELECTED.canReject()).isFalse();
            assertThat(RfqItemStatus.REJECTED.canReject()).isFalse();
            assertThat(RfqItemStatus.NO_RESPONSE.canReject()).isFalse();
        }

        @Test
        @DisplayName("canDeselect() - only SELECTED")
        void canDeselect() {
            assertThat(RfqItemStatus.SENT.canDeselect()).isFalse();
            assertThat(RfqItemStatus.REPLIED.canDeselect()).isFalse();
            assertThat(RfqItemStatus.SELECTED.canDeselect()).isTrue();
            assertThat(RfqItemStatus.REJECTED.canDeselect()).isFalse();
            assertThat(RfqItemStatus.NO_RESPONSE.canDeselect()).isFalse();
        }

        @Test
        @DisplayName("canUnreject() - only REJECTED")
        void canUnreject() {
            assertThat(RfqItemStatus.SENT.canUnreject()).isFalse();
            assertThat(RfqItemStatus.REPLIED.canUnreject()).isFalse();
            assertThat(RfqItemStatus.SELECTED.canUnreject()).isFalse();
            assertThat(RfqItemStatus.REJECTED.canUnreject()).isTrue();
            assertThat(RfqItemStatus.NO_RESPONSE.canUnreject()).isFalse();
        }

        @Test
        @DisplayName("canCreatePurchaseOrder() - REPLIED or SELECTED")
        void canCreatePurchaseOrder() {
            assertThat(RfqItemStatus.SENT.canCreatePurchaseOrder()).isFalse();
            assertThat(RfqItemStatus.REPLIED.canCreatePurchaseOrder()).isTrue();
            assertThat(RfqItemStatus.SELECTED.canCreatePurchaseOrder()).isTrue();
            assertThat(RfqItemStatus.REJECTED.canCreatePurchaseOrder()).isFalse();
            assertThat(RfqItemStatus.NO_RESPONSE.canCreatePurchaseOrder()).isFalse();
        }

        @Test
        @DisplayName("isTerminal() - only NO_RESPONSE")
        void isTerminal() {
            assertThat(RfqItemStatus.SENT.isTerminal()).isFalse();
            assertThat(RfqItemStatus.REPLIED.isTerminal()).isFalse();
            assertThat(RfqItemStatus.SELECTED.isTerminal()).isFalse();
            assertThat(RfqItemStatus.REJECTED.isTerminal()).isFalse();
            assertThat(RfqItemStatus.NO_RESPONSE.isTerminal()).isTrue();
        }
    }
}
