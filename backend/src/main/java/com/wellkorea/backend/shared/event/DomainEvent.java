package com.wellkorea.backend.shared.event;

/**
 * Marker interface for all domain events.
 * All events that can be published through DomainEventPublisher must implement this interface.
 *
 * <p>This abstraction allows future migration from Spring's in-memory event publishing
 * to external message queues (Kafka, RabbitMQ, etc.) without changing business logic.
 *
 * @see DomainEventPublisher
 */
public interface DomainEvent {
}
