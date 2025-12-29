package com.wellkorea.backend.shared.event;

import com.wellkorea.backend.approval.domain.vo.EntityType;

/**
 * Base interface for domain events that require approval workflow.
 * Implement this interface for any entity that needs to go through
 * the multi-level approval process.
 *
 * <p>Extends DomainEvent to enable publishing through DomainEventPublisher abstraction.
 *
 * <p>Usage example:
 * <pre>
 * public record QuotationSubmittedEvent(
 *     Long quotationId,
 *     String description,
 *     Long submittedByUserId
 * ) implements ApprovalRequiredEvent {
 *     // implement interface methods
 * }
 * </pre>
 */
public interface ApprovalRequiredEvent extends DomainEvent {

    /**
     * The type of entity requiring approval.
     */
    EntityType getEntityType();

    /**
     * The ID of the entity requiring approval.
     */
    Long getEntityId();

    /**
     * Human-readable description of the entity for approval display.
     */
    String getEntityDescription();

    /**
     * The ID of the user who submitted this for approval.
     */
    Long getSubmittedByUserId();
}
