package com.wellkorea.backend.delivery.infrastructure.persistence;

import com.wellkorea.backend.delivery.domain.Delivery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository for Delivery entities.
 * Provides queries for delivery tracking and over-delivery prevention.
 * <p>
 * Concurrency control is handled by {@link com.wellkorea.backend.shared.lock.ProjectLockService}
 * at the service layer, not at the repository level.
 */
@Repository
public interface DeliveryRepository extends JpaRepository<Delivery, Long> {
}
