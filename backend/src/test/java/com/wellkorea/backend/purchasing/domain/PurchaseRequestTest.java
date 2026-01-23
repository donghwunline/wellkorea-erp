package com.wellkorea.backend.purchasing.domain;

import com.wellkorea.backend.purchasing.domain.vo.PurchaseRequestStatus;
import com.wellkorea.backend.purchasing.domain.vo.RfqItem;
import com.wellkorea.backend.purchasing.domain.vo.RfqItemStatus;
import org.junit.jupiter.api.*;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Unit tests for PurchaseRequest state machine.
 * <p>
 * State Diagram:
 * <pre>
 *     [*] --> DRAFT
 *     DRAFT --> RFQ_SENT (sendRfq)
 *     DRAFT --> CANCELED (cancel)
 *     RFQ_SENT --> RFQ_SENT (sendRfq - add more vendors)
 *     RFQ_SENT --> VENDOR_SELECTED (markVendorSelected)
 *     RFQ_SENT --> CANCELED (cancel)
 *     VENDOR_SELECTED --> RFQ_SENT (revertVendorSelection)
 *     VENDOR_SELECTED --> ORDERED (markOrdered) [when PO is created]
 *     VENDOR_SELECTED --> CANCELED (cancel)
 *     ORDERED --> RFQ_SENT (revertVendorSelection) [when PO is canceled]
 *     ORDERED --> CLOSED (close) [when PO is received]
 *     ORDERED --> CANCELED (cancel)
 * </pre>
 *
 * @see PurchaseRequest
 * @see PurchaseRequestStatus
 */
@Tag("unit")
@DisplayName("PurchaseRequest State Machine")
class PurchaseRequestTest {

    private TestPurchaseRequest purchaseRequest;

    @BeforeEach
    void setUp() {
        purchaseRequest = new TestPurchaseRequest();
    }

    /**
     * Concrete implementation of PurchaseRequest for testing.
     */
    static class TestPurchaseRequest extends PurchaseRequest {
        @Override
        public String getItemName() {
            return "Test Item";
        }
    }

    @Nested
    @DisplayName("Initial State")
    class InitialState {

        @Test
        @DisplayName("should start in DRAFT status")
        void shouldStartInDraftStatus() {
            // When
            TestPurchaseRequest newRequest = new TestPurchaseRequest();

            // Then
            assertThat(newRequest.getStatus()).isEqualTo(PurchaseRequestStatus.DRAFT);
        }
    }

    @Nested
    @DisplayName("Guard Methods")
    class GuardMethods {

        @Test
        @DisplayName("canSendRfq should return true for DRAFT")
        void canSendRfqShouldReturnTrueForDraft() {
            assertThat(purchaseRequest.getStatus()).isEqualTo(PurchaseRequestStatus.DRAFT);
            assertThat(purchaseRequest.canSendRfq()).isTrue();
        }

        @Test
        @DisplayName("canSendRfq should return true for RFQ_SENT")
        void canSendRfqShouldReturnTrueForRfqSent() {
            // Given
            purchaseRequest.sendRfq();

            // Then
            assertThat(purchaseRequest.getStatus()).isEqualTo(PurchaseRequestStatus.RFQ_SENT);
            assertThat(purchaseRequest.canSendRfq()).isTrue();
        }

        @Test
        @DisplayName("canSendRfq should return false for VENDOR_SELECTED")
        void canSendRfqShouldReturnFalseForVendorSelected() {
            // Given
            purchaseRequest.sendRfq();
            purchaseRequest.markVendorSelected();

            // Then
            assertThat(purchaseRequest.canSendRfq()).isFalse();
        }

        @Test
        @DisplayName("canCancel should return true for non-terminal states")
        void canCancelShouldReturnTrueForNonTerminalStates() {
            // DRAFT
            assertThat(purchaseRequest.canCancel()).isTrue();

            // RFQ_SENT
            purchaseRequest.sendRfq();
            assertThat(purchaseRequest.canCancel()).isTrue();

            // VENDOR_SELECTED
            purchaseRequest.markVendorSelected();
            assertThat(purchaseRequest.canCancel()).isTrue();

            // ORDERED
            purchaseRequest.markOrdered();
            assertThat(purchaseRequest.canCancel()).isTrue();
        }

        @Test
        @DisplayName("canCancel should return false for terminal states")
        void canCancelShouldReturnFalseForTerminalStates() {
            // CLOSED (now requires ORDERED state first)
            purchaseRequest.sendRfq();
            purchaseRequest.markVendorSelected();
            purchaseRequest.markOrdered();
            purchaseRequest.close();
            assertThat(purchaseRequest.canCancel()).isFalse();

            // CANCELED
            TestPurchaseRequest canceledRequest = new TestPurchaseRequest();
            canceledRequest.cancel();
            assertThat(canceledRequest.canCancel()).isFalse();
        }

        @Test
        @DisplayName("canUpdate should return true only for DRAFT")
        void canUpdateShouldReturnTrueOnlyForDraft() {
            // DRAFT
            assertThat(purchaseRequest.canUpdate()).isTrue();

            // RFQ_SENT
            purchaseRequest.sendRfq();
            assertThat(purchaseRequest.canUpdate()).isFalse();
        }
    }

    @Nested
    @DisplayName("DRAFT → RFQ_SENT transition (sendRfq)")
    class SendRfqTransition {

        @Test
        @DisplayName("should transition from DRAFT to RFQ_SENT")
        void shouldTransitionFromDraftToRfqSent() {
            // Given
            assertThat(purchaseRequest.getStatus()).isEqualTo(PurchaseRequestStatus.DRAFT);

            // When
            purchaseRequest.sendRfq();

            // Then
            assertThat(purchaseRequest.getStatus()).isEqualTo(PurchaseRequestStatus.RFQ_SENT);
        }

        @Test
        @DisplayName("should be idempotent when already in RFQ_SENT")
        void shouldBeIdempotentWhenAlreadyInRfqSent() {
            // Given
            purchaseRequest.sendRfq();
            assertThat(purchaseRequest.getStatus()).isEqualTo(PurchaseRequestStatus.RFQ_SENT);

            // When - send again (adding more vendors)
            purchaseRequest.sendRfq();

            // Then - still RFQ_SENT
            assertThat(purchaseRequest.getStatus()).isEqualTo(PurchaseRequestStatus.RFQ_SENT);
        }

        @Test
        @DisplayName("should throw when sending from VENDOR_SELECTED")
        void shouldThrowWhenSendingFromVendorSelected() {
            // Given
            purchaseRequest.sendRfq();
            purchaseRequest.markVendorSelected();

            // When / Then
            assertThatThrownBy(() -> purchaseRequest.sendRfq())
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Cannot send RFQ")
                    .hasMessageContaining("VENDOR_SELECTED");
        }

        @Test
        @DisplayName("should throw when sending from CLOSED")
        void shouldThrowWhenSendingFromClosed() {
            // Given (now requires ORDERED state before CLOSED)
            purchaseRequest.sendRfq();
            purchaseRequest.markVendorSelected();
            purchaseRequest.markOrdered();
            purchaseRequest.close();

            // When / Then
            assertThatThrownBy(() -> purchaseRequest.sendRfq())
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Cannot send RFQ")
                    .hasMessageContaining("CLOSED");
        }
    }

    @Nested
    @DisplayName("RFQ_SENT → VENDOR_SELECTED transition (markVendorSelected)")
    class MarkVendorSelectedTransition {

        @BeforeEach
        void setUpRfqSentState() {
            purchaseRequest.sendRfq();
        }

        @Test
        @DisplayName("should transition from RFQ_SENT to VENDOR_SELECTED")
        void shouldTransitionFromRfqSentToVendorSelected() {
            // Given
            assertThat(purchaseRequest.getStatus()).isEqualTo(PurchaseRequestStatus.RFQ_SENT);

            // When
            purchaseRequest.markVendorSelected();

            // Then
            assertThat(purchaseRequest.getStatus()).isEqualTo(PurchaseRequestStatus.VENDOR_SELECTED);
        }

        @Test
        @DisplayName("should throw when marking vendor selected from DRAFT")
        void shouldThrowWhenMarkingVendorSelectedFromDraft() {
            // Given
            TestPurchaseRequest draftRequest = new TestPurchaseRequest();

            // When / Then
            assertThatThrownBy(() -> draftRequest.markVendorSelected())
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Cannot select vendor")
                    .hasMessageContaining("DRAFT");
        }
    }

    @Nested
    @DisplayName("VENDOR_SELECTED → ORDERED transition (markOrdered)")
    class MarkOrderedTransition {

        @BeforeEach
        void setUpVendorSelectedState() {
            purchaseRequest.sendRfq();
            purchaseRequest.markVendorSelected();
        }

        @Test
        @DisplayName("should transition from VENDOR_SELECTED to ORDERED")
        void shouldTransitionFromVendorSelectedToOrdered() {
            // Given
            assertThat(purchaseRequest.getStatus()).isEqualTo(PurchaseRequestStatus.VENDOR_SELECTED);

            // When
            purchaseRequest.markOrdered();

            // Then
            assertThat(purchaseRequest.getStatus()).isEqualTo(PurchaseRequestStatus.ORDERED);
        }

        @Test
        @DisplayName("should throw when marking ordered from RFQ_SENT")
        void shouldThrowWhenMarkingOrderedFromRfqSent() {
            // Given
            TestPurchaseRequest rfqSentRequest = new TestPurchaseRequest();
            rfqSentRequest.sendRfq();

            // When / Then
            assertThatThrownBy(() -> rfqSentRequest.markOrdered())
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Cannot mark as ordered")
                    .hasMessageContaining("RFQ_SENT");
        }

        @Test
        @DisplayName("should throw when marking ordered from DRAFT")
        void shouldThrowWhenMarkingOrderedFromDraft() {
            // Given
            TestPurchaseRequest draftRequest = new TestPurchaseRequest();

            // When / Then
            assertThatThrownBy(() -> draftRequest.markOrdered())
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Cannot mark as ordered")
                    .hasMessageContaining("DRAFT");
        }
    }

    @Nested
    @DisplayName("ORDERED → CLOSED transition (close)")
    class CloseTransition {

        @BeforeEach
        void setUpOrderedState() {
            purchaseRequest.sendRfq();
            purchaseRequest.markVendorSelected();
            purchaseRequest.markOrdered();
        }

        @Test
        @DisplayName("should transition from ORDERED to CLOSED")
        void shouldTransitionFromOrderedToClosed() {
            // Given
            assertThat(purchaseRequest.getStatus()).isEqualTo(PurchaseRequestStatus.ORDERED);

            // When
            purchaseRequest.close();

            // Then
            assertThat(purchaseRequest.getStatus()).isEqualTo(PurchaseRequestStatus.CLOSED);
        }

        @Test
        @DisplayName("should throw when closing from VENDOR_SELECTED")
        void shouldThrowWhenClosingFromVendorSelected() {
            // Given
            TestPurchaseRequest vendorSelectedRequest = new TestPurchaseRequest();
            vendorSelectedRequest.sendRfq();
            vendorSelectedRequest.markVendorSelected();

            // When / Then
            assertThatThrownBy(() -> vendorSelectedRequest.close())
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Cannot close")
                    .hasMessageContaining("VENDOR_SELECTED");
        }

        @Test
        @DisplayName("should throw when closing from RFQ_SENT")
        void shouldThrowWhenClosingFromRfqSent() {
            // Given
            TestPurchaseRequest rfqSentRequest = new TestPurchaseRequest();
            rfqSentRequest.sendRfq();

            // When / Then
            assertThatThrownBy(() -> rfqSentRequest.close())
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Cannot close")
                    .hasMessageContaining("RFQ_SENT");
        }
    }

    @Nested
    @DisplayName("Cancel transition")
    class CancelTransition {

        @Test
        @DisplayName("should transition from DRAFT to CANCELED")
        void shouldTransitionFromDraftToCanceled() {
            // Given
            assertThat(purchaseRequest.getStatus()).isEqualTo(PurchaseRequestStatus.DRAFT);

            // When
            purchaseRequest.cancel();

            // Then
            assertThat(purchaseRequest.getStatus()).isEqualTo(PurchaseRequestStatus.CANCELED);
        }

        @Test
        @DisplayName("should transition from RFQ_SENT to CANCELED")
        void shouldTransitionFromRfqSentToCanceled() {
            // Given
            purchaseRequest.sendRfq();

            // When
            purchaseRequest.cancel();

            // Then
            assertThat(purchaseRequest.getStatus()).isEqualTo(PurchaseRequestStatus.CANCELED);
        }

        @Test
        @DisplayName("should transition from VENDOR_SELECTED to CANCELED")
        void shouldTransitionFromVendorSelectedToCanceled() {
            // Given
            purchaseRequest.sendRfq();
            purchaseRequest.markVendorSelected();

            // When
            purchaseRequest.cancel();

            // Then
            assertThat(purchaseRequest.getStatus()).isEqualTo(PurchaseRequestStatus.CANCELED);
        }

        @Test
        @DisplayName("should transition from ORDERED to CANCELED")
        void shouldTransitionFromOrderedToCanceled() {
            // Given
            purchaseRequest.sendRfq();
            purchaseRequest.markVendorSelected();
            purchaseRequest.markOrdered();

            // When
            purchaseRequest.cancel();

            // Then
            assertThat(purchaseRequest.getStatus()).isEqualTo(PurchaseRequestStatus.CANCELED);
        }

        @Test
        @DisplayName("should throw when canceling from CLOSED")
        void shouldThrowWhenCancelingFromClosed() {
            // Given (now requires ORDERED state before CLOSED)
            purchaseRequest.sendRfq();
            purchaseRequest.markVendorSelected();
            purchaseRequest.markOrdered();
            purchaseRequest.close();

            // When / Then
            assertThatThrownBy(() -> purchaseRequest.cancel())
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Cannot cancel")
                    .hasMessageContaining("CLOSED");
        }

        @Test
        @DisplayName("should throw when canceling from CANCELED")
        void shouldThrowWhenCancelingFromCanceled() {
            // Given
            purchaseRequest.cancel();

            // When / Then
            assertThatThrownBy(() -> purchaseRequest.cancel())
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Cannot cancel")
                    .hasMessageContaining("CANCELED");
        }
    }

    @Nested
    @DisplayName("VENDOR_SELECTED → RFQ_SENT transition (revertVendorSelection)")
    class RevertVendorSelectionTransition {

        private RfqItem selectedItem;
        private RfqItem rejectedItem1;
        private RfqItem rejectedItem2;
        private RfqItem sentItem;

        @BeforeEach
        void setUpVendorSelectedStateWithRfqItems() {
            // Add RFQ items
            selectedItem = purchaseRequest.addRfqItem(1L, null);
            rejectedItem1 = purchaseRequest.addRfqItem(2L, null);
            rejectedItem2 = purchaseRequest.addRfqItem(3L, null);
            sentItem = purchaseRequest.addRfqItem(4L, null);

            // Transition to RFQ_SENT
            purchaseRequest.sendRfq();

            // Record replies for items 1-3
            purchaseRequest.recordRfqReply(selectedItem.getItemId(), new BigDecimal("1000"), 7, null);
            purchaseRequest.recordRfqReply(rejectedItem1.getItemId(), new BigDecimal("1500"), 10, null);
            purchaseRequest.recordRfqReply(rejectedItem2.getItemId(), new BigDecimal("2000"), 14, null);
            // sentItem never replies - stays in SENT

            // Reject items 2 and 3
            purchaseRequest.rejectRfq(rejectedItem1.getItemId());
            purchaseRequest.rejectRfq(rejectedItem2.getItemId());

            // Select item 1
            purchaseRequest.selectVendor(selectedItem.getItemId());

            // Verify initial state
            assertThat(purchaseRequest.getStatus()).isEqualTo(PurchaseRequestStatus.VENDOR_SELECTED);
            assertThat(selectedItem.getStatus()).isEqualTo(RfqItemStatus.SELECTED);
            assertThat(rejectedItem1.getStatus()).isEqualTo(RfqItemStatus.REJECTED);
            assertThat(rejectedItem2.getStatus()).isEqualTo(RfqItemStatus.REJECTED);
            assertThat(sentItem.getStatus()).isEqualTo(RfqItemStatus.SENT);
        }

        @Test
        @DisplayName("should transition from VENDOR_SELECTED to RFQ_SENT")
        void shouldTransitionFromVendorSelectedToRfqSent() {
            // When
            purchaseRequest.revertVendorSelection(selectedItem.getItemId());

            // Then
            assertThat(purchaseRequest.getStatus()).isEqualTo(PurchaseRequestStatus.RFQ_SENT);
        }

        @Test
        @DisplayName("should deselect the selected RfqItem")
        void shouldDeselectTheSelectedRfqItem() {
            // When
            purchaseRequest.revertVendorSelection(selectedItem.getItemId());

            // Then
            assertThat(selectedItem.getStatus()).isEqualTo(RfqItemStatus.REPLIED);
        }

        @Test
        @DisplayName("should unreject all REJECTED RfqItems")
        void shouldUnrejectAllRejectedRfqItems() {
            // When
            purchaseRequest.revertVendorSelection(selectedItem.getItemId());

            // Then
            assertThat(rejectedItem1.getStatus()).isEqualTo(RfqItemStatus.REPLIED);
            assertThat(rejectedItem2.getStatus()).isEqualTo(RfqItemStatus.REPLIED);
        }

        @Test
        @DisplayName("should not change SENT RfqItems")
        void shouldNotChangeSentRfqItems() {
            // When
            purchaseRequest.revertVendorSelection(selectedItem.getItemId());

            // Then - SENT items stay SENT
            assertThat(sentItem.getStatus()).isEqualTo(RfqItemStatus.SENT);
        }

        @Test
        @DisplayName("should throw when reverting from RFQ_SENT")
        void shouldThrowWhenRevertingFromRfqSent() {
            // Given
            TestPurchaseRequest rfqSentRequest = new TestPurchaseRequest();
            RfqItem item = rfqSentRequest.addRfqItem(1L, null);
            rfqSentRequest.sendRfq();

            // When / Then
            assertThatThrownBy(() -> rfqSentRequest.revertVendorSelection(item.getItemId()))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Cannot revert vendor selection")
                    .hasMessageContaining("RFQ_SENT");
        }

        @Test
        @DisplayName("should allow selecting a different vendor after revert")
        void shouldAllowSelectingDifferentVendorAfterRevert() {
            // When - revert
            purchaseRequest.revertVendorSelection(selectedItem.getItemId());

            // Then - can select a previously rejected vendor
            assertThat(purchaseRequest.getStatus()).isEqualTo(PurchaseRequestStatus.RFQ_SENT);
            purchaseRequest.selectVendor(rejectedItem1.getItemId());

            assertThat(purchaseRequest.getStatus()).isEqualTo(PurchaseRequestStatus.VENDOR_SELECTED);
            assertThat(rejectedItem1.getStatus()).isEqualTo(RfqItemStatus.SELECTED);
        }

        @Test
        @DisplayName("should allow adding new vendors after revert")
        void shouldAllowAddingNewVendorsAfterRevert() {
            // When - revert
            purchaseRequest.revertVendorSelection(selectedItem.getItemId());

            // Then - can add new vendor
            assertThat(purchaseRequest.canSendRfq()).isTrue();
            RfqItem newItem = purchaseRequest.addRfqItem(5L, null);
            purchaseRequest.sendRfq();

            assertThat(newItem.getStatus()).isEqualTo(RfqItemStatus.SENT);
        }
    }

    @Nested
    @DisplayName("RfqItem Aggregate Methods")
    class RfqItemAggregateMethods {

        @Test
        @DisplayName("addRfqItem should create item with SENT status")
        void addRfqItemShouldCreateItemWithSentStatus() {
            // When
            RfqItem item = purchaseRequest.addRfqItem(1L, 100L);

            // Then
            assertThat(item.getStatus()).isEqualTo(RfqItemStatus.SENT);
            assertThat(item.getVendorCompanyId()).isEqualTo(1L);
            assertThat(item.getVendorOfferingId()).isEqualTo(100L);
            assertThat(purchaseRequest.getRfqItems()).hasSize(1);
        }

        @Test
        @DisplayName("selectVendor should transition both PR and RfqItem status")
        void selectVendorShouldTransitionBothStatuses() {
            // Given
            RfqItem item = purchaseRequest.addRfqItem(1L, null);
            purchaseRequest.sendRfq();
            purchaseRequest.recordRfqReply(item.getItemId(), new BigDecimal("1000"), 7, null);

            // When
            purchaseRequest.selectVendor(item.getItemId());

            // Then
            assertThat(purchaseRequest.getStatus()).isEqualTo(PurchaseRequestStatus.VENDOR_SELECTED);
            assertThat(item.getStatus()).isEqualTo(RfqItemStatus.SELECTED);
        }

        @Test
        @DisplayName("should throw when selecting vendor that is not REPLIED")
        void shouldThrowWhenSelectingVendorThatIsNotReplied() {
            // Given
            RfqItem item = purchaseRequest.addRfqItem(1L, null);
            purchaseRequest.sendRfq();

            // When / Then - item is still SENT
            assertThatThrownBy(() -> purchaseRequest.selectVendor(item.getItemId()))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Cannot select")
                    .hasMessageContaining("SENT");
        }

        @Test
        @DisplayName("should throw when selecting second vendor (PR already in VENDOR_SELECTED)")
        void shouldThrowWhenSelectingSecondVendor() {
            // Given
            RfqItem item1 = purchaseRequest.addRfqItem(1L, null);
            RfqItem item2 = purchaseRequest.addRfqItem(2L, null);
            purchaseRequest.sendRfq();
            purchaseRequest.recordRfqReply(item1.getItemId(), new BigDecimal("1000"), 7, null);
            purchaseRequest.recordRfqReply(item2.getItemId(), new BigDecimal("2000"), 14, null);
            purchaseRequest.selectVendor(item1.getItemId());

            // When / Then - PR is in VENDOR_SELECTED, can't select again
            assertThatThrownBy(() -> purchaseRequest.selectVendor(item2.getItemId()))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Cannot select vendor")
                    .hasMessageContaining("VENDOR_SELECTED");
        }
    }

    @Nested
    @DisplayName("Full Workflow Scenarios")
    class FullWorkflowScenarios {

        @Test
        @DisplayName("Happy path: DRAFT → RFQ_SENT → VENDOR_SELECTED → ORDERED → CLOSED")
        void happyPathDraftToRfqSentToVendorSelectedToOrderedToClosed() {
            // Given
            assertThat(purchaseRequest.getStatus()).isEqualTo(PurchaseRequestStatus.DRAFT);
            RfqItem item = purchaseRequest.addRfqItem(1L, null);

            // When - send RFQ
            purchaseRequest.sendRfq();
            assertThat(purchaseRequest.getStatus()).isEqualTo(PurchaseRequestStatus.RFQ_SENT);

            // When - vendor replies
            purchaseRequest.recordRfqReply(item.getItemId(), new BigDecimal("5000"), 14, "Best price");
            assertThat(item.getStatus()).isEqualTo(RfqItemStatus.REPLIED);

            // When - select vendor
            purchaseRequest.selectVendor(item.getItemId());
            assertThat(purchaseRequest.getStatus()).isEqualTo(PurchaseRequestStatus.VENDOR_SELECTED);
            assertThat(item.getStatus()).isEqualTo(RfqItemStatus.SELECTED);

            // When - mark as ordered (PO created)
            purchaseRequest.markOrdered();
            assertThat(purchaseRequest.getStatus()).isEqualTo(PurchaseRequestStatus.ORDERED);

            // When - close (PO received)
            purchaseRequest.close();

            // Then
            assertThat(purchaseRequest.getStatus()).isEqualTo(PurchaseRequestStatus.CLOSED);
        }

        @Test
        @DisplayName("Revert scenario: select → revert → select different vendor")
        void revertScenarioSelectRevertSelectDifferent() {
            // Given - setup with 2 vendors
            RfqItem vendor1 = purchaseRequest.addRfqItem(1L, null);
            RfqItem vendor2 = purchaseRequest.addRfqItem(2L, null);
            purchaseRequest.sendRfq();
            purchaseRequest.recordRfqReply(vendor1.getItemId(), new BigDecimal("1000"), 7, null);
            purchaseRequest.recordRfqReply(vendor2.getItemId(), new BigDecimal("800"), 10, null);

            // When - reject vendor2, select vendor1
            purchaseRequest.rejectRfq(vendor2.getItemId());
            purchaseRequest.selectVendor(vendor1.getItemId());
            assertThat(purchaseRequest.getStatus()).isEqualTo(PurchaseRequestStatus.VENDOR_SELECTED);
            assertThat(vendor2.getStatus()).isEqualTo(RfqItemStatus.REJECTED);

            // When - PO canceled, revert
            purchaseRequest.revertVendorSelection(vendor1.getItemId());
            assertThat(purchaseRequest.getStatus()).isEqualTo(PurchaseRequestStatus.RFQ_SENT);
            assertThat(vendor1.getStatus()).isEqualTo(RfqItemStatus.REPLIED);
            assertThat(vendor2.getStatus()).isEqualTo(RfqItemStatus.REPLIED); // unrejected

            // When - now select vendor2 (previously rejected)
            purchaseRequest.selectVendor(vendor2.getItemId());

            // Then
            assertThat(purchaseRequest.getStatus()).isEqualTo(PurchaseRequestStatus.VENDOR_SELECTED);
            assertThat(vendor2.getStatus()).isEqualTo(RfqItemStatus.SELECTED);
        }

        @Test
        @DisplayName("Add more vendors after revert")
        void addMoreVendorsAfterRevert() {
            // Given - setup and select vendor
            RfqItem vendor1 = purchaseRequest.addRfqItem(1L, null);
            purchaseRequest.sendRfq();
            purchaseRequest.recordRfqReply(vendor1.getItemId(), new BigDecimal("1000"), 7, null);
            purchaseRequest.selectVendor(vendor1.getItemId());

            // When - revert
            purchaseRequest.revertVendorSelection(vendor1.getItemId());

            // When - add new vendor
            RfqItem vendor2 = purchaseRequest.addRfqItem(2L, null);
            purchaseRequest.sendRfq();

            // Then - new vendor added, can get quote and be selected
            assertThat(purchaseRequest.getRfqItems()).hasSize(2);
            assertThat(vendor2.getStatus()).isEqualTo(RfqItemStatus.SENT);

            purchaseRequest.recordRfqReply(vendor2.getItemId(), new BigDecimal("800"), 5, null);
            purchaseRequest.selectVendor(vendor2.getItemId());

            assertThat(purchaseRequest.getStatus()).isEqualTo(PurchaseRequestStatus.VENDOR_SELECTED);
            assertThat(vendor2.getStatus()).isEqualTo(RfqItemStatus.SELECTED);
        }

        @Test
        @DisplayName("Add new vendors when all existing RfqItems are NO_RESPONSE or REJECTED")
        void addNewVendorsWhenAllItemsNoResponseOrRejected() {
            // Given - send RFQ to 3 vendors
            RfqItem vendor1 = purchaseRequest.addRfqItem(1L, null);
            RfqItem vendor2 = purchaseRequest.addRfqItem(2L, null);
            RfqItem vendor3 = purchaseRequest.addRfqItem(3L, null);
            purchaseRequest.sendRfq();

            // Vendor 1 doesn't respond
            purchaseRequest.markRfqNoResponse(vendor1.getItemId());

            // Vendors 2 and 3 reply but get rejected
            purchaseRequest.recordRfqReply(vendor2.getItemId(), new BigDecimal("5000"), 30, "Too expensive");
            purchaseRequest.recordRfqReply(vendor3.getItemId(), new BigDecimal("4500"), 45, "Lead time too long");
            purchaseRequest.rejectRfq(vendor2.getItemId());
            purchaseRequest.rejectRfq(vendor3.getItemId());

            // Verify - all items are in terminal or rejected state
            assertThat(vendor1.getStatus()).isEqualTo(RfqItemStatus.NO_RESPONSE);
            assertThat(vendor2.getStatus()).isEqualTo(RfqItemStatus.REJECTED);
            assertThat(vendor3.getStatus()).isEqualTo(RfqItemStatus.REJECTED);

            // PR should still be in RFQ_SENT, allowing user to add more vendors
            assertThat(purchaseRequest.getStatus()).isEqualTo(PurchaseRequestStatus.RFQ_SENT);
            assertThat(purchaseRequest.canSendRfq()).isTrue();

            // When - add new vendor
            RfqItem vendor4 = purchaseRequest.addRfqItem(4L, null);
            purchaseRequest.sendRfq(); // idempotent

            // Then - new vendor added successfully
            assertThat(purchaseRequest.getRfqItems()).hasSize(4);
            assertThat(vendor4.getStatus()).isEqualTo(RfqItemStatus.SENT);

            // And - can complete the workflow with the new vendor
            purchaseRequest.recordRfqReply(vendor4.getItemId(), new BigDecimal("2000"), 7, "Good price");
            purchaseRequest.selectVendor(vendor4.getItemId());

            assertThat(purchaseRequest.getStatus()).isEqualTo(PurchaseRequestStatus.VENDOR_SELECTED);
            assertThat(vendor4.getStatus()).isEqualTo(RfqItemStatus.SELECTED);
        }
    }

    @Nested
    @DisplayName("Terminal States")
    class TerminalStates {

        @Test
        @DisplayName("CLOSED should not allow any transitions except terminal state checks")
        void closedShouldNotAllowAnyTransitions() {
            // Given (now requires ORDERED state before CLOSED)
            purchaseRequest.sendRfq();
            purchaseRequest.markVendorSelected();
            purchaseRequest.markOrdered();
            purchaseRequest.close();

            // Then
            assertThatThrownBy(() -> purchaseRequest.sendRfq())
                    .isInstanceOf(IllegalStateException.class);
            assertThatThrownBy(() -> purchaseRequest.cancel())
                    .isInstanceOf(IllegalStateException.class);
        }

        @Test
        @DisplayName("CANCELED should not allow any transitions")
        void canceledShouldNotAllowAnyTransitions() {
            // Given
            purchaseRequest.cancel();

            // Then
            assertThatThrownBy(() -> purchaseRequest.sendRfq())
                    .isInstanceOf(IllegalStateException.class);
            assertThatThrownBy(() -> purchaseRequest.cancel())
                    .isInstanceOf(IllegalStateException.class);
        }
    }

    @Nested
    @DisplayName("ORDERED → RFQ_SENT transition (revertVendorSelection from ORDERED)")
    class RevertFromOrderedTransition {

        private RfqItem selectedItem;
        private RfqItem rejectedItem;

        @BeforeEach
        void setUpOrderedStateWithRfqItems() {
            // Add RFQ items
            selectedItem = purchaseRequest.addRfqItem(1L, null);
            rejectedItem = purchaseRequest.addRfqItem(2L, null);

            // Transition to RFQ_SENT
            purchaseRequest.sendRfq();

            // Record replies
            purchaseRequest.recordRfqReply(selectedItem.getItemId(), new BigDecimal("1000"), 7, null);
            purchaseRequest.recordRfqReply(rejectedItem.getItemId(), new BigDecimal("1500"), 10, null);

            // Reject one item
            purchaseRequest.rejectRfq(rejectedItem.getItemId());

            // Select vendor
            purchaseRequest.selectVendor(selectedItem.getItemId());

            // Mark as ordered (PO created)
            purchaseRequest.markOrdered();

            // Verify initial state
            assertThat(purchaseRequest.getStatus()).isEqualTo(PurchaseRequestStatus.ORDERED);
            assertThat(selectedItem.getStatus()).isEqualTo(RfqItemStatus.SELECTED);
            assertThat(rejectedItem.getStatus()).isEqualTo(RfqItemStatus.REJECTED);
        }

        @Test
        @DisplayName("should transition from ORDERED to RFQ_SENT when PO is canceled")
        void shouldTransitionFromOrderedToRfqSent() {
            // When - revert (PO canceled)
            purchaseRequest.revertVendorSelection(selectedItem.getItemId());

            // Then
            assertThat(purchaseRequest.getStatus()).isEqualTo(PurchaseRequestStatus.RFQ_SENT);
        }

        @Test
        @DisplayName("should deselect the selected RfqItem when reverting from ORDERED")
        void shouldDeselectTheSelectedRfqItemWhenRevertingFromOrdered() {
            // When
            purchaseRequest.revertVendorSelection(selectedItem.getItemId());

            // Then
            assertThat(selectedItem.getStatus()).isEqualTo(RfqItemStatus.REPLIED);
        }

        @Test
        @DisplayName("should unreject all REJECTED RfqItems when reverting from ORDERED")
        void shouldUnrejectAllRejectedRfqItemsWhenRevertingFromOrdered() {
            // When
            purchaseRequest.revertVendorSelection(selectedItem.getItemId());

            // Then
            assertThat(rejectedItem.getStatus()).isEqualTo(RfqItemStatus.REPLIED);
        }

        @Test
        @DisplayName("should allow selecting a different vendor after reverting from ORDERED")
        void shouldAllowSelectingDifferentVendorAfterRevertFromOrdered() {
            // When - revert
            purchaseRequest.revertVendorSelection(selectedItem.getItemId());

            // Then - can select the previously rejected vendor
            assertThat(purchaseRequest.getStatus()).isEqualTo(PurchaseRequestStatus.RFQ_SENT);
            purchaseRequest.selectVendor(rejectedItem.getItemId());

            assertThat(purchaseRequest.getStatus()).isEqualTo(PurchaseRequestStatus.VENDOR_SELECTED);
            assertThat(rejectedItem.getStatus()).isEqualTo(RfqItemStatus.SELECTED);
        }
    }
}
