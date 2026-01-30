package com.wellkorea.backend.purchasing.infrastructure.config;

import com.wellkorea.backend.shared.approval.domain.vo.EntityType;
import com.wellkorea.backend.purchasing.infrastructure.persistence.PurchaseRequestRepository;
import com.wellkorea.backend.shared.approval.application.ApprovableRegistry;
import com.wellkorea.backend.shared.approval.domain.Approvable;
import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration that registers PurchaseRequest as an Approvable entity
 * in the ApprovableRegistry for vendor selection approval workflow.
 */
@Configuration
public class PurchaseRequestApprovalConfig {

    private final ApprovableRegistry registry;
    private final PurchaseRequestRepository repository;

    public PurchaseRequestApprovalConfig(
            ApprovableRegistry registry,
            PurchaseRequestRepository repository) {
        this.registry = registry;
        this.repository = repository;
    }

    @PostConstruct
    public void registerResolver() {
        registry.register(EntityType.VENDOR_SELECTION,
                entityId -> repository.findById(entityId).map(pr -> (Approvable) pr));
    }
}
