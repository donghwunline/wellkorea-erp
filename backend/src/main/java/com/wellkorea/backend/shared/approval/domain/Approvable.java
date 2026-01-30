package com.wellkorea.backend.shared.approval.domain;

import com.wellkorea.backend.shared.approval.domain.vo.ApprovalState;
import com.wellkorea.backend.shared.approval.domain.vo.EntityType;
import com.wellkorea.backend.shared.approval.application.ApprovableRegistry;
import com.wellkorea.backend.shared.approval.application.GenericApprovalCompletedHandler;

/**
 * Interface for entities that can be approved through the approval workflow.
 *
 * <p>Implementing this interface allows an entity to participate in the generic
 * approval workflow handled by {@link GenericApprovalCompletedHandler}.
 *
 * <p>The entity must:
 * <ul>
 *   <li>Embed an {@link ApprovalState} field to track approval status</li>
 *   <li>Register its resolver in {@link ApprovableRegistry}</li>
 *   <li>Implement callback methods to handle approval/rejection</li>
 * </ul>
 *
 * <p>Example implementation:
 * <pre>
 * &#64;Entity
 * public class PurchaseRequest implements Approvable {
 *     &#64;Embedded
 *     private ApprovalState approvalState = new ApprovalState();
 *
 *     &#64;Override
 *     public EntityType getApprovalEntityType() {
 *         return EntityType.VENDOR_SELECTION;
 *     }
 *
 *     &#64;Override
 *     public void onApprovalGranted() {
 *         // Transition to approved state
 *         this.status = Status.VENDOR_SELECTED;
 *         this.approvalState.markApproved();
 *     }
 *
 *     &#64;Override
 *     public void onApprovalRejected(String reason) {
 *         // Revert to previous state
 *         this.status = Status.RFQ_SENT;
 *         this.approvalState.markRejected();
 *     }
 * }
 * </pre>
 */
public interface Approvable {

    /**
     * Get the entity ID.
     */
    Long getId();

    /**
     * Get the entity type for the approval workflow.
     * This determines which approval chain template is used.
     */
    EntityType getApprovalEntityType();

    /**
     * Get the embedded approval state.
     */
    ApprovalState getApprovalState();

    /**
     * Get a human-readable description for display in the approval list.
     * Should include enough context for approvers to understand what they're approving.
     */
    String getApprovalDescription();

    /**
     * Callback invoked when approval is granted.
     * The implementation should:
     * <ul>
     *   <li>Transition the entity to its approved state</li>
     *   <li>Call {@code approvalState.markApproved()}</li>
     *   <li>Perform any post-approval actions</li>
     * </ul>
     */
    void onApprovalGranted();

    /**
     * Callback invoked when approval is rejected.
     * The implementation should:
     * <ul>
     *   <li>Revert the entity to its pre-approval state</li>
     *   <li>Call {@code approvalState.markRejected()}</li>
     *   <li>Perform any post-rejection cleanup</li>
     * </ul>
     *
     * @param reason the rejection reason provided by the approver
     */
    void onApprovalRejected(String reason);
}
