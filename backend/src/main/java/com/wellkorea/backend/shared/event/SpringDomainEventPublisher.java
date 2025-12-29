package com.wellkorea.backend.shared.event;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

/**
 * Spring-based implementation of DomainEventPublisher.
 * Delegates to Spring's ApplicationEventPublisher for in-memory, synchronous event publishing.
 *
 * <p>This implementation works with Spring's @EventListener and @TransactionalEventListener
 * annotations on handler methods.
 *
 * <p>To migrate to Kafka or RabbitMQ, create a new implementation:
 * <pre>
 * &#64;Component
 * &#64;Profile("kafka")
 * public class KafkaDomainEventPublisher implements DomainEventPublisher {
 *     private final KafkaTemplate&lt;String, Object&gt; kafkaTemplate;
 *
 *     &#64;Override
 *     public void publish(DomainEvent event) {
 *         kafkaTemplate.send("domain-events", event);
 *     }
 * }
 * </pre>
 *
 * @see DomainEventPublisher
 * @see DomainEvent
 */
@Component
public class SpringDomainEventPublisher implements DomainEventPublisher {

    private final ApplicationEventPublisher applicationEventPublisher;

    public SpringDomainEventPublisher(ApplicationEventPublisher applicationEventPublisher) {
        this.applicationEventPublisher = applicationEventPublisher;
    }

    @Override
    public void publish(DomainEvent event) {
        applicationEventPublisher.publishEvent(event);
    }
}
