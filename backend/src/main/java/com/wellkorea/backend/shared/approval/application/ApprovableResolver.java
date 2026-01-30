package com.wellkorea.backend.shared.approval.application;

import com.wellkorea.backend.shared.approval.domain.Approvable;

import java.util.Optional;

/**
 * Functional interface for resolving an Approvable entity by its ID.
 * Used by {@link ApprovableRegistry} to lookup entities when processing approval events.
 *
 * <p>Implementations typically delegate to a JPA repository:
 * <pre>
 * registry.register(EntityType.VENDOR_SELECTION,
 *     entityId -> repository.findById(entityId).map(pr -> (Approvable) pr));
 * </pre>
 */
@FunctionalInterface
public interface ApprovableResolver {

    /**
     * Resolve an Approvable entity by its ID.
     *
     * @param entityId the entity ID to lookup
     * @return Optional containing the Approvable if found, empty otherwise
     */
    Optional<Approvable> resolve(Long entityId);
}
