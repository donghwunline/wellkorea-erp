package com.wellkorea.backend.core.purchasing.domain;

import com.wellkorea.backend.core.purchasing.domain.service.RfqItemFactory;
import com.wellkorea.backend.core.purchasing.domain.vo.AttachmentReference;
import com.wellkorea.backend.core.purchasing.domain.vo.PurchaseRequestStatus;
import com.wellkorea.backend.core.purchasing.domain.vo.RfqItem;
import com.wellkorea.backend.core.purchasing.domain.vo.RfqItemStatus;
import com.wellkorea.backend.supporting.approval.domain.vo.ApprovalStateStatus;
import org.junit.jupiter.api.*;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Unit tests for PurchaseRequest vendor selection approval workflow.
 * Tests the Approvable interface implementation for vendor selection.
 * <p>
 * Vendor Selection Approval Flow:
 * <pre>
 *     RFQ_SENT → submitVendorSelectionForApproval() → PENDING_VENDOR_APPROVAL
 *     PENDING_VENDOR_APPROVAL → onApprovalGranted() → VENDOR_SELECTED (item becomes SELECTED)
 *     PENDING_VENDOR_APPROVAL → onApprovalRejected() → RFQ_SENT (item remains REPLIED)
 * </pre>
 *
 * @see PurchaseRequest#submitVendorSelectionForApproval(String, Long)
 * @see PurchaseRequest#onApprovalGranted(Long)
 * @see PurchaseRequest#onApprovalRejected(Long, String)
 */
@Tag("unit")
@DisplayName("PurchaseRequest Vendor Selection Approval")
class PurchaseRequestVendorApprovalTest {

    private TestPurchaseRequest purchaseRequest;
    private RfqItemFactory mockFactory;

    @BeforeEach
    void setUp() {
        purchaseRequest = new TestPurchaseRequest();
        mockFactory = new TestRfqItemFactory();
    }

    /**
     * Concrete implementation of PurchaseRequest for testing.
     */
    static class TestPurchaseRequest extends PurchaseRequest {
        @Override
        public String getItemName() {
            return "Test Item";
        }

        @Override
        public List<AttachmentReference> getAttachments() {
            return Collections.emptyList();
        }
    }

    /**
     * Mock RfqItemFactory for testing - creates RfqItems without vendor validation.
     */
    static class TestRfqItemFactory implements RfqItemFactory {
        @Override
        public List<RfqItem> createRfqItems(List<Long> vendorIds) {
            return vendorIds.stream()
                    .map(id -> new RfqItem(id, null))
                    .toList();
        }
    }

    @Nested
    @DisplayName("submitVendorSelectionForApproval")
    class SubmitVendorSelectionForApproval {

        private RfqItem repliedItem;
        private static final Long SUBMITTER_ID = 100L;

        @BeforeEach
        void setUpRfqSentState() {
            purchaseRequest.sendRfq(List.of(1L), mockFactory);
            repliedItem = purchaseRequest.getRfqItems().getFirst();
            purchaseRequest.recordRfqReply(repliedItem.getItemId(), new BigDecimal("1000"), 7, null);
        }

        @Test
        @DisplayName("should submit RFQ item for approval when status is RFQ_SENT")
        void shouldSubmitWhenStatusIsRfqSent() {
            // Given
            assertThat(purchaseRequest.getStatus()).isEqualTo(PurchaseRequestStatus.RFQ_SENT);
            assertThat(repliedItem.getStatus()).isEqualTo(RfqItemStatus.REPLIED);

            // When
            purchaseRequest.submitVendorSelectionForApproval(repliedItem.getItemId(), SUBMITTER_ID);

            // Then - successful submission
            assertThat(purchaseRequest.getStatus()).isEqualTo(PurchaseRequestStatus.PENDING_VENDOR_APPROVAL);
        }

        @Test
        @DisplayName("should set status to PENDING_VENDOR_APPROVAL")
        void shouldSetStatusToPendingVendorApproval() {
            // When
            purchaseRequest.submitVendorSelectionForApproval(repliedItem.getItemId(), SUBMITTER_ID);

            // Then
            assertThat(purchaseRequest.getStatus()).isEqualTo(PurchaseRequestStatus.PENDING_VENDOR_APPROVAL);
        }

        @Test
        @DisplayName("should store pendingSelectedRfqItemId")
        void shouldStorePendingSelectedRfqItemId() {
            // When
            purchaseRequest.submitVendorSelectionForApproval(repliedItem.getItemId(), SUBMITTER_ID);

            // Then
            assertThat(purchaseRequest.getPendingSelectedRfqItemId()).isEqualTo(repliedItem.getItemId());
        }

        @Test
        @DisplayName("should set approval state to PENDING")
        void shouldSetApprovalStateToPending() {
            // When
            purchaseRequest.submitVendorSelectionForApproval(repliedItem.getItemId(), SUBMITTER_ID);

            // Then
            assertThat(purchaseRequest.getApprovalState().getStatus()).isEqualTo(ApprovalStateStatus.PENDING);
            assertThat(purchaseRequest.getApprovalState().isPending()).isTrue();
        }

        @Test
        @DisplayName("should throw when not in RFQ_SENT status")
        void shouldThrowWhenNotInRfqSentStatus() {
            // Given - purchase request in DRAFT status
            TestPurchaseRequest draftRequest = new TestPurchaseRequest();

            // When / Then
            assertThatThrownBy(() -> draftRequest.submitVendorSelectionForApproval("item-id", SUBMITTER_ID))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("RFQ_SENT");
        }

        @Test
        @DisplayName("should throw when already pending approval")
        void shouldThrowWhenAlreadyPendingApproval() {
            // Given - already submitted
            purchaseRequest.submitVendorSelectionForApproval(repliedItem.getItemId(), SUBMITTER_ID);

            // When / Then - fails because status is PENDING_VENDOR_APPROVAL, not RFQ_SENT
            assertThatThrownBy(() -> purchaseRequest.submitVendorSelectionForApproval(repliedItem.getItemId(), SUBMITTER_ID))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("PENDING_VENDOR_APPROVAL");
        }

        @Test
        @DisplayName("should throw when item is not REPLIED")
        void shouldThrowWhenItemIsNotReplied() {
            // Given - add a second item that is still SENT
            purchaseRequest.sendRfq(List.of(2L), mockFactory);
            RfqItem sentItem = purchaseRequest.getRfqItems().get(1);
            assertThat(sentItem.getStatus()).isEqualTo(RfqItemStatus.SENT);

            // When / Then
            assertThatThrownBy(() -> purchaseRequest.submitVendorSelectionForApproval(sentItem.getItemId(), SUBMITTER_ID))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("REPLIED");
        }

        @Test
        @DisplayName("should throw when a vendor is already selected")
        void shouldThrowWhenVendorAlreadySelected() {
            // Given - select the vendor directly (skipping approval)
            purchaseRequest.selectVendor(repliedItem.getItemId());

            // Add another REPLIED item and try to submit it
            purchaseRequest.revertVendorSelection(repliedItem.getItemId());
            purchaseRequest.sendRfq(List.of(2L), mockFactory);
            RfqItem item2 = purchaseRequest.getRfqItems().get(1);
            purchaseRequest.recordRfqReply(item2.getItemId(), new BigDecimal("2000"), 14, null);

            // Select first vendor
            purchaseRequest.selectVendor(repliedItem.getItemId());

            // When / Then - cannot submit when a vendor is already selected
            TestPurchaseRequest newRequest = new TestPurchaseRequest();
            newRequest.sendRfq(List.of(1L, 2L), mockFactory);
            List<RfqItem> items = newRequest.getRfqItems();
            newRequest.recordRfqReply(items.get(0).getItemId(), new BigDecimal("1000"), 7, null);
            newRequest.recordRfqReply(items.get(1).getItemId(), new BigDecimal("2000"), 14, null);
            newRequest.selectVendor(items.get(0).getItemId());

            assertThatThrownBy(() -> newRequest.submitVendorSelectionForApproval(items.get(1).getItemId(), SUBMITTER_ID))
                    .isInstanceOf(IllegalStateException.class);
        }

        @Test
        @DisplayName("should not change RfqItem status when submitting")
        void shouldNotChangeRfqItemStatusWhenSubmitting() {
            // When
            purchaseRequest.submitVendorSelectionForApproval(repliedItem.getItemId(), SUBMITTER_ID);

            // Then - item remains REPLIED until approval is granted
            assertThat(repliedItem.getStatus()).isEqualTo(RfqItemStatus.REPLIED);
        }
    }

    @Nested
    @DisplayName("onApprovalGranted")
    class OnApprovalGranted {

        private RfqItem repliedItem;
        private static final Long SUBMITTER_ID = 100L;
        private static final Long APPROVER_ID = 200L;

        @BeforeEach
        void setUpPendingApprovalState() {
            purchaseRequest.sendRfq(List.of(1L), mockFactory);
            repliedItem = purchaseRequest.getRfqItems().getFirst();
            purchaseRequest.recordRfqReply(repliedItem.getItemId(), new BigDecimal("1000"), 7, null);
            purchaseRequest.submitVendorSelectionForApproval(repliedItem.getItemId(), SUBMITTER_ID);
        }

        @Test
        @DisplayName("should change status to VENDOR_SELECTED when approved")
        void shouldChangeStatusToVendorSelectedWhenApproved() {
            // When
            purchaseRequest.onApprovalGranted(APPROVER_ID);

            // Then
            assertThat(purchaseRequest.getStatus()).isEqualTo(PurchaseRequestStatus.VENDOR_SELECTED);
        }

        @Test
        @DisplayName("should mark RFQ item as SELECTED")
        void shouldMarkRfqItemAsSelected() {
            // When
            purchaseRequest.onApprovalGranted(APPROVER_ID);

            // Then
            assertThat(repliedItem.getStatus()).isEqualTo(RfqItemStatus.SELECTED);
        }

        @Test
        @DisplayName("should clear pendingSelectedRfqItemId")
        void shouldClearPendingSelectedRfqItemId() {
            // Given
            assertThat(purchaseRequest.getPendingSelectedRfqItemId()).isNotNull();

            // When
            purchaseRequest.onApprovalGranted(APPROVER_ID);

            // Then
            assertThat(purchaseRequest.getPendingSelectedRfqItemId()).isNull();
        }

        @Test
        @DisplayName("should update approval state to APPROVED")
        void shouldUpdateApprovalStateToApproved() {
            // When
            purchaseRequest.onApprovalGranted(APPROVER_ID);

            // Then
            assertThat(purchaseRequest.getApprovalState().getStatus()).isEqualTo(ApprovalStateStatus.APPROVED);
            assertThat(purchaseRequest.getApprovalState().isApproved()).isTrue();
        }

        @Test
        @DisplayName("should throw when not pending approval")
        void shouldThrowWhenNotPendingApproval() {
            // Given - not submitted for approval
            TestPurchaseRequest newRequest = new TestPurchaseRequest();
            newRequest.sendRfq(List.of(1L), mockFactory);

            // When / Then
            assertThatThrownBy(() -> newRequest.onApprovalGranted(APPROVER_ID))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("pending");
        }

        @Test
        @DisplayName("should throw when approval already completed")
        void shouldThrowWhenApprovalAlreadyCompleted() {
            // Given - already approved
            purchaseRequest.onApprovalGranted(APPROVER_ID);

            // When / Then
            assertThatThrownBy(() -> purchaseRequest.onApprovalGranted(APPROVER_ID))
                    .isInstanceOf(IllegalStateException.class);
        }
    }

    @Nested
    @DisplayName("onApprovalRejected")
    class OnApprovalRejected {

        private RfqItem repliedItem;
        private static final Long SUBMITTER_ID = 100L;
        private static final Long REJECTOR_ID = 200L;
        private static final String REJECTION_REASON = "Price too high";

        @BeforeEach
        void setUpPendingApprovalState() {
            purchaseRequest.sendRfq(List.of(1L), mockFactory);
            repliedItem = purchaseRequest.getRfqItems().getFirst();
            purchaseRequest.recordRfqReply(repliedItem.getItemId(), new BigDecimal("1000"), 7, null);
            purchaseRequest.submitVendorSelectionForApproval(repliedItem.getItemId(), SUBMITTER_ID);
        }

        @Test
        @DisplayName("should revert status to RFQ_SENT when rejected")
        void shouldRevertStatusToRfqSentWhenRejected() {
            // When
            purchaseRequest.onApprovalRejected(REJECTOR_ID, REJECTION_REASON);

            // Then
            assertThat(purchaseRequest.getStatus()).isEqualTo(PurchaseRequestStatus.RFQ_SENT);
        }

        @Test
        @DisplayName("should keep RFQ item as REPLIED (unchanged)")
        void shouldKeepRfqItemAsReplied() {
            // Given - item is REPLIED before rejection
            assertThat(repliedItem.getStatus()).isEqualTo(RfqItemStatus.REPLIED);

            // When
            purchaseRequest.onApprovalRejected(REJECTOR_ID, REJECTION_REASON);

            // Then - item remains REPLIED
            assertThat(repliedItem.getStatus()).isEqualTo(RfqItemStatus.REPLIED);
        }

        @Test
        @DisplayName("should clear pendingSelectedRfqItemId")
        void shouldClearPendingSelectedRfqItemId() {
            // Given
            assertThat(purchaseRequest.getPendingSelectedRfqItemId()).isNotNull();

            // When
            purchaseRequest.onApprovalRejected(REJECTOR_ID, REJECTION_REASON);

            // Then
            assertThat(purchaseRequest.getPendingSelectedRfqItemId()).isNull();
        }

        @Test
        @DisplayName("should update approval state to REJECTED")
        void shouldUpdateApprovalStateToRejected() {
            // When
            purchaseRequest.onApprovalRejected(REJECTOR_ID, REJECTION_REASON);

            // Then
            assertThat(purchaseRequest.getApprovalState().getStatus()).isEqualTo(ApprovalStateStatus.REJECTED);
            assertThat(purchaseRequest.getApprovalState().isRejected()).isTrue();
        }

        @Test
        @DisplayName("should throw when not pending approval")
        void shouldThrowWhenNotPendingApproval() {
            // Given - not submitted for approval
            TestPurchaseRequest newRequest = new TestPurchaseRequest();
            newRequest.sendRfq(List.of(1L), mockFactory);

            // When / Then
            assertThatThrownBy(() -> newRequest.onApprovalRejected(REJECTOR_ID, REJECTION_REASON))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("pending");
        }
    }

    @Nested
    @DisplayName("Full Workflow Scenarios")
    class FullWorkflowScenarios {

        private static final Long SUBMITTER_ID = 100L;
        private static final Long APPROVER_ID = 200L;
        private static final String REJECTION_REASON = "Need better quote";

        @Test
        @DisplayName("Happy path: RFQ_SENT -> submit -> approve -> VENDOR_SELECTED")
        void happyPathSubmitApproveVendorSelected() {
            // Given
            purchaseRequest.sendRfq(List.of(1L), mockFactory);
            RfqItem item = purchaseRequest.getRfqItems().getFirst();
            purchaseRequest.recordRfqReply(item.getItemId(), new BigDecimal("1000"), 7, null);

            assertThat(purchaseRequest.getStatus()).isEqualTo(PurchaseRequestStatus.RFQ_SENT);
            assertThat(item.getStatus()).isEqualTo(RfqItemStatus.REPLIED);

            // When - submit for approval
            purchaseRequest.submitVendorSelectionForApproval(item.getItemId(), SUBMITTER_ID);
            assertThat(purchaseRequest.getStatus()).isEqualTo(PurchaseRequestStatus.PENDING_VENDOR_APPROVAL);
            assertThat(item.getStatus()).isEqualTo(RfqItemStatus.REPLIED); // Still REPLIED

            // When - approve
            purchaseRequest.onApprovalGranted(APPROVER_ID);

            // Then
            assertThat(purchaseRequest.getStatus()).isEqualTo(PurchaseRequestStatus.VENDOR_SELECTED);
            assertThat(item.getStatus()).isEqualTo(RfqItemStatus.SELECTED);
            assertThat(purchaseRequest.getPendingSelectedRfqItemId()).isNull();
            assertThat(purchaseRequest.getApprovalState().isApproved()).isTrue();
        }

        @Test
        @DisplayName("Rejection path: RFQ_SENT -> submit -> reject -> RFQ_SENT (can retry)")
        void rejectionPathSubmitRejectCanRetry() {
            // Given
            purchaseRequest.sendRfq(List.of(1L), mockFactory);
            RfqItem item = purchaseRequest.getRfqItems().getFirst();
            purchaseRequest.recordRfqReply(item.getItemId(), new BigDecimal("1000"), 7, null);

            // When - submit and reject
            purchaseRequest.submitVendorSelectionForApproval(item.getItemId(), SUBMITTER_ID);
            purchaseRequest.onApprovalRejected(APPROVER_ID, REJECTION_REASON);

            // Then - back to RFQ_SENT
            assertThat(purchaseRequest.getStatus()).isEqualTo(PurchaseRequestStatus.RFQ_SENT);
            assertThat(item.getStatus()).isEqualTo(RfqItemStatus.REPLIED);
            assertThat(purchaseRequest.getPendingSelectedRfqItemId()).isNull();
            assertThat(purchaseRequest.getApprovalState().isRejected()).isTrue();
        }

        @Test
        @DisplayName("Resubmit after rejection: reject -> reset -> submit again -> approve")
        void resubmitAfterRejection() {
            // Given
            purchaseRequest.sendRfq(List.of(1L, 2L), mockFactory);
            List<RfqItem> items = purchaseRequest.getRfqItems();
            RfqItem item1 = items.get(0);
            RfqItem item2 = items.get(1);
            purchaseRequest.recordRfqReply(item1.getItemId(), new BigDecimal("1000"), 7, null);
            purchaseRequest.recordRfqReply(item2.getItemId(), new BigDecimal("800"), 5, null);

            // When - submit item1 and get rejected
            purchaseRequest.submitVendorSelectionForApproval(item1.getItemId(), SUBMITTER_ID);
            purchaseRequest.onApprovalRejected(APPROVER_ID, REJECTION_REASON);

            assertThat(purchaseRequest.getStatus()).isEqualTo(PurchaseRequestStatus.RFQ_SENT);
            assertThat(purchaseRequest.getApprovalState().isRejected()).isTrue();

            // When - reset approval state and submit item2 instead
            purchaseRequest.getApprovalState().reset();
            purchaseRequest.submitVendorSelectionForApproval(item2.getItemId(), SUBMITTER_ID);
            purchaseRequest.onApprovalGranted(APPROVER_ID);

            // Then - item2 is now selected
            assertThat(purchaseRequest.getStatus()).isEqualTo(PurchaseRequestStatus.VENDOR_SELECTED);
            assertThat(item1.getStatus()).isEqualTo(RfqItemStatus.REPLIED); // Still REPLIED
            assertThat(item2.getStatus()).isEqualTo(RfqItemStatus.SELECTED);
            assertThat(purchaseRequest.getApprovalState().isApproved()).isTrue();
        }

        @Test
        @DisplayName("Multiple vendors: submit first, reject, submit second, approve")
        void multipleVendorsSelectAfterRejection() {
            // Given - 3 vendors
            purchaseRequest.sendRfq(List.of(1L, 2L, 3L), mockFactory);
            List<RfqItem> items = purchaseRequest.getRfqItems();
            items.forEach(item ->
                    purchaseRequest.recordRfqReply(item.getItemId(), new BigDecimal("1000"), 7, null));

            RfqItem vendor1 = items.get(0);
            RfqItem vendor2 = items.get(1);
            RfqItem vendor3 = items.get(2);

            // When - submit vendor1, get rejected
            purchaseRequest.submitVendorSelectionForApproval(vendor1.getItemId(), SUBMITTER_ID);
            purchaseRequest.onApprovalRejected(APPROVER_ID, "Too expensive");

            // Reset and submit vendor2, get rejected
            purchaseRequest.getApprovalState().reset();
            purchaseRequest.submitVendorSelectionForApproval(vendor2.getItemId(), SUBMITTER_ID);
            purchaseRequest.onApprovalRejected(APPROVER_ID, "Bad reviews");

            // Reset and submit vendor3, get approved
            purchaseRequest.getApprovalState().reset();
            purchaseRequest.submitVendorSelectionForApproval(vendor3.getItemId(), SUBMITTER_ID);
            purchaseRequest.onApprovalGranted(APPROVER_ID);

            // Then
            assertThat(purchaseRequest.getStatus()).isEqualTo(PurchaseRequestStatus.VENDOR_SELECTED);
            assertThat(vendor1.getStatus()).isEqualTo(RfqItemStatus.REPLIED);
            assertThat(vendor2.getStatus()).isEqualTo(RfqItemStatus.REPLIED);
            assertThat(vendor3.getStatus()).isEqualTo(RfqItemStatus.SELECTED);
        }

        @Test
        @DisplayName("Approval workflow continues to ORDERED and CLOSED")
        void fullLifecycleWithApprovalWorkflow() {
            // Given
            purchaseRequest.sendRfq(List.of(1L), mockFactory);
            RfqItem item = purchaseRequest.getRfqItems().getFirst();
            purchaseRequest.recordRfqReply(item.getItemId(), new BigDecimal("1000"), 7, null);

            // When - approval workflow
            purchaseRequest.submitVendorSelectionForApproval(item.getItemId(), SUBMITTER_ID);
            purchaseRequest.onApprovalGranted(APPROVER_ID);

            assertThat(purchaseRequest.getStatus()).isEqualTo(PurchaseRequestStatus.VENDOR_SELECTED);

            // When - continue to ORDERED
            purchaseRequest.markOrdered();
            assertThat(purchaseRequest.getStatus()).isEqualTo(PurchaseRequestStatus.ORDERED);

            // When - close
            purchaseRequest.close();

            // Then
            assertThat(purchaseRequest.getStatus()).isEqualTo(PurchaseRequestStatus.CLOSED);
        }
    }
}
