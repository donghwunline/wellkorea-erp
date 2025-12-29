package com.wellkorea.backend.quotation.infrastructure.repository;

import com.wellkorea.backend.quotation.domain.QuotationLineItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository for QuotationLineItem entity write operations (CQRS Command side).
 *
 * <p>Line items are managed through the parent {@code Quotation} aggregate with cascade
 * and orphanRemoval. Direct repository access is rarely needed.
 *
 * <p>For read operations, line items are fetched via {@code QuotationMapper.findDetailById()}
 * which includes nested line item queries.
 */
@Repository
public interface QuotationLineItemRepository extends JpaRepository<QuotationLineItem, Long> {
    // Line items managed through Quotation aggregate with cascade/orphanRemoval
}
