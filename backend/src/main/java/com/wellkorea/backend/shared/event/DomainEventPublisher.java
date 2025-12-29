package com.wellkorea.backend.shared.event;

/**
 * Interface for publishing domain events.
 * Abstracts the underlying event transport mechanism to enable future migration
 * from Spring's in-memory events to message queues like Kafka or RabbitMQ.
 *
 * <p>Current implementation uses Spring's ApplicationEventPublisher.
 * To migrate to Kafka, create a new implementation of this interface.
 *
 * <p>Usage example:
 * <pre>
 * &#64;Service
 * public class QuotationService {
 *     private final DomainEventPublisher eventPublisher;
 *
 *     public void submitForApproval(Long quotationId) {
 *         // ... business logic ...
 *         eventPublisher.publish(new QuotationSubmittedEvent(...));
 *     }
 * }
 * </pre>
 *
 * @see DomainEvent
 * @see SpringDomainEventPublisher
 */
public interface DomainEventPublisher {

    /**
     * Publish a domain event to registered listeners/subscribers.
     *
     * @param event the domain event to publish
     */
    void publish(DomainEvent event);
}
