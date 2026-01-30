package com.wellkorea.backend.purchasing.domain.event;

import com.wellkorea.backend.shared.approval.domain.vo.EntityType;
import com.wellkorea.backend.shared.event.ApprovalRequiredEvent;

import java.math.BigDecimal;

/**
 * Domain event published when a vendor selection is submitted for approval.
 * This event triggers the creation of an ApprovalRequest for the vendor selection workflow.
 *
 * <p>The approval workflow allows designated approvers to review and approve/reject
 * the vendor selection before the purchase request transitions to VENDOR_SELECTED status.
 */
public record VendorSelectionSubmittedEvent(
        Long purchaseRequestId,
        String rfqItemId,
        Long vendorCompanyId,
        BigDecimal quotedPrice,
        Long submittedByUserId
) implements ApprovalRequiredEvent {

    @Override
    public EntityType getEntityType() {
        return EntityType.VENDOR_SELECTION;
    }

    @Override
    public Long getEntityId() {
        return purchaseRequestId;
    }

    @Override
    public String getEntityDescription() {
        return String.format("업체선정: PR-%d, 업체 %d (₩%s)",
                purchaseRequestId, vendorCompanyId, quotedPrice);
    }

    @Override
    public Long getSubmittedByUserId() {
        return submittedByUserId;
    }
}
