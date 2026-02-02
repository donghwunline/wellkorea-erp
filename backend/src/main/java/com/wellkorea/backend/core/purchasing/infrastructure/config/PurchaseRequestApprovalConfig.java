package com.wellkorea.backend.core.purchasing.infrastructure.config;

import com.wellkorea.backend.core.purchasing.infrastructure.persistence.PurchaseRequestRepository;
import com.wellkorea.backend.supporting.approval.application.ApprovableRegistry;
import com.wellkorea.backend.supporting.approval.domain.Approvable;
import com.wellkorea.backend.supporting.approval.domain.vo.EntityType;
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
