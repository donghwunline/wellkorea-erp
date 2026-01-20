package com.wellkorea.backend.quotation.domain.event;

import com.wellkorea.backend.shared.event.DomainEvent;

/**
 * Domain event published when a quotation is accepted by the customer.
 * This event is handled by ProjectStatusEventHandler to update project status to ACTIVE.
 */
public record QuotationAcceptedEvent(
        Long quotationId,
        Long projectId,
        Long acceptedByUserId
) implements DomainEvent {
}
