package com.wellkorea.backend.quotation.infrastructure.config;

import com.wellkorea.backend.quotation.infrastructure.repository.QuotationRepository;
import com.wellkorea.backend.supporting.approval.application.ApprovableRegistry;
import com.wellkorea.backend.supporting.approval.domain.Approvable;
import com.wellkorea.backend.supporting.approval.domain.vo.EntityType;
import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration class that registers Quotation as an Approvable entity.
 * This allows the GenericApprovalCompletedHandler to resolve Quotation entities
 * when approval workflows complete.
 */
@Configuration
public class QuotationApprovalConfig {

    private final ApprovableRegistry registry;
    private final QuotationRepository repository;

    public QuotationApprovalConfig(ApprovableRegistry registry, QuotationRepository repository) {
        this.registry = registry;
        this.repository = repository;
    }

    @PostConstruct
    public void registerResolver() {
        registry.register(EntityType.QUOTATION,
                entityId -> repository.findById(entityId).map(q -> (Approvable) q));
    }
}
