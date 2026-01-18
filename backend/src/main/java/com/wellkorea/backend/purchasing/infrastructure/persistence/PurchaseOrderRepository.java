package com.wellkorea.backend.purchasing.infrastructure.persistence;

import com.wellkorea.backend.purchasing.domain.PurchaseOrder;
import com.wellkorea.backend.purchasing.domain.PurchaseOrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for PurchaseOrder entities.
 */
@Repository
public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long> {

    @Query("SELECT MAX(CAST(SUBSTRING(po.poNumber, 9) AS int)) FROM PurchaseOrder po WHERE po.poNumber LIKE :prefix%")
    Integer findMaxSequenceForYear(@Param("prefix") String prefix);

    @Query("SELECT po FROM PurchaseOrder po " +
            "LEFT JOIN FETCH po.vendor " +
            "LEFT JOIN FETCH po.purchaseRequest " +
            "LEFT JOIN FETCH po.project " +
            "LEFT JOIN FETCH po.createdBy " +
            "WHERE po.id = :id")
    Optional<PurchaseOrder> findByIdWithDetails(@Param("id") Long id);

    /**
     * Check if an active (non-canceled) PO exists for the given RFQ item.
     * Used for duplicate PO validation when creating a new PO.
     */
    boolean existsByPurchaseRequestIdAndRfqItemIdAndStatusNot(Long purchaseRequestId, String rfqItemId, PurchaseOrderStatus status);
}
