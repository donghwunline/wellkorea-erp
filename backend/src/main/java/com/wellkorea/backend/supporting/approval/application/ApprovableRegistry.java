package com.wellkorea.backend.supporting.approval.application;

import com.wellkorea.backend.supporting.approval.domain.vo.EntityType;
import com.wellkorea.backend.supporting.approval.domain.Approvable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.Map;
import java.util.Optional;

/**
 * Registry for Approvable entity resolvers.
 * Maps EntityType to the corresponding resolver for looking up entities during approval events.
 *
 * <p>Entity modules register their resolvers at startup via @PostConstruct:
 * <pre>
 * &#64;Configuration
 * public class PurchaseRequestApprovalConfig {
 *     private final ApprovableRegistry registry;
 *     private final PurchaseRequestRepository repository;
 *
 *     &#64;PostConstruct
 *     public void registerResolver() {
 *         registry.register(EntityType.VENDOR_SELECTION,
 *             entityId -> repository.findById(entityId).map(pr -> (Approvable) pr));
 *     }
 * }
 * </pre>
 *
 * <p>The registry is used by {@link GenericApprovalCompletedHandler} to resolve entities
 * when processing approval completion events.
 */
@Component
public class ApprovableRegistry {

    private static final Logger log = LoggerFactory.getLogger(ApprovableRegistry.class);

    private final Map<EntityType, ApprovableResolver> resolvers = new EnumMap<>(EntityType.class);

    /**
     * Register a resolver for the given entity type.
     * If a resolver is already registered for this type, it will be replaced.
     *
     * @param type     the entity type
     * @param resolver the resolver function
     */
    public void register(EntityType type, ApprovableResolver resolver) {
        resolvers.put(type, resolver);
        log.info("Registered Approvable resolver for entity type: {}", type);
    }

    /**
     * Resolve an Approvable entity by type and ID.
     *
     * @param type     the entity type
     * @param entityId the entity ID
     * @return Optional containing the Approvable if found and resolver exists, empty otherwise
     */
    public Optional<Approvable> resolve(EntityType type, Long entityId) {
        ApprovableResolver resolver = resolvers.get(type);
        if (resolver == null) {
            return Optional.empty();
        }
        return resolver.resolve(entityId);
    }

    /**
     * Check if a resolver is registered for the given entity type.
     *
     * @param type the entity type
     * @return true if a resolver is registered
     */
    public boolean supports(EntityType type) {
        return resolvers.containsKey(type);
    }
}
