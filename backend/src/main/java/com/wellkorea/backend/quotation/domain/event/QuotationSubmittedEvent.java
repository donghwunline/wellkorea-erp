package com.wellkorea.backend.quotation.domain.event;

import com.wellkorea.backend.approval.domain.vo.EntityType;
import com.wellkorea.backend.shared.event.ApprovalRequiredEvent;

/**
 * Domain event published when a quotation is submitted for approval.
 * This event is handled by ApprovalEventHandler to create an approval request.
 */
public record QuotationSubmittedEvent(
        Long quotationId,
        int version,
        String jobCode,
        Long submittedByUserId
) implements ApprovalRequiredEvent {

    @Override
    public EntityType getEntityType() {
        return EntityType.QUOTATION;
    }

    @Override
    public Long getEntityId() {
        return quotationId;
    }

    @Override
    public String getEntityDescription() {
        return String.format("견적서 v%d - %s", version, jobCode);
    }

    @Override
    public Long getSubmittedByUserId() {
        return submittedByUserId;
    }
}
