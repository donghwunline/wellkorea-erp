package com.wellkorea.backend.core.purchasing.domain.service;

import com.wellkorea.backend.core.purchasing.domain.vo.RfqItem;

import java.util.List;

/**
 * Domain service for creating RfqItems with vendor validation.
 * <p>
 * Interface defined in domain layer; implementation in infrastructure.
 * This follows the Domain Service pattern where the interface belongs to the domain
 * but the implementation requires infrastructure dependencies (repository access).
 * <p>
 * Note on vendorOfferingId: RfqItem has an optional vendorOfferingId field for linking
 * to pre-configured vendor offerings (pre-negotiated prices/lead times). This is currently
 * unused (always null) - it's a placeholder for future functionality where users could
 * select from pre-configured offerings when sending RFQs.
 */
public interface RfqItemFactory {

    /**
     * Validate vendors and create RfqItems.
     * <p>
     * Each created RfqItem will have:
     * - Generated UUID as itemId
     * - sentAt initialized to current timestamp
     * - status set to SENT
     * - vendorOfferingId set to null (future: link to pre-configured offerings)
     *
     * @param vendorIds List of company IDs to validate as vendors
     * @return List of created RfqItems
     * @throws com.wellkorea.backend.shared.exception.ResourceNotFoundException if vendor not found
     * @throws IllegalArgumentException                                         if company is not a vendor/outsource
     */
    List<RfqItem> createRfqItems(List<Long> vendorIds);
}
