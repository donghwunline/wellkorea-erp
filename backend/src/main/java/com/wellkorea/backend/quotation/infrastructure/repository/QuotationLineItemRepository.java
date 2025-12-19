package com.wellkorea.backend.quotation.infrastructure.repository;

import com.wellkorea.backend.quotation.domain.QuotationLineItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for QuotationLineItem entity.
 */
@Repository
public interface QuotationLineItemRepository extends JpaRepository<QuotationLineItem, Long> {

    /**
     * Find line items by quotation ID ordered by sequence.
     */
    List<QuotationLineItem> findByQuotationIdOrderBySequenceAsc(Long quotationId);

    /**
     * Delete all line items for a quotation.
     */
    @Modifying
    @Query("DELETE FROM QuotationLineItem li WHERE li.quotation.id = :quotationId")
    void deleteAllByQuotationId(@Param("quotationId") Long quotationId);

    /**
     * Count line items for a quotation.
     */
    long countByQuotationId(Long quotationId);
}
