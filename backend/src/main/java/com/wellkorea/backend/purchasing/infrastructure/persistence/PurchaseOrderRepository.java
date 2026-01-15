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

    Optional<PurchaseOrder> findByPoNumber(String poNumber);

    Page<PurchaseOrder> findByVendorId(Long vendorId, Pageable pageable);

    Page<PurchaseOrder> findByProjectId(Long projectId, Pageable pageable);

    Page<PurchaseOrder> findByStatus(PurchaseOrderStatus status, Pageable pageable);

    Page<PurchaseOrder> findByVendorIdAndStatus(Long vendorId, PurchaseOrderStatus status, Pageable pageable);

    List<PurchaseOrder> findByRfqItemId(Long rfqItemId);

    @Query("SELECT MAX(CAST(SUBSTRING(po.poNumber, 9) AS int)) FROM PurchaseOrder po WHERE po.poNumber LIKE :prefix%")
    Integer findMaxSequenceForYear(@Param("prefix") String prefix);

    @Query("SELECT po FROM PurchaseOrder po " +
           "LEFT JOIN FETCH po.vendor " +
           "LEFT JOIN FETCH po.rfqItem " +
           "LEFT JOIN FETCH po.project " +
           "LEFT JOIN FETCH po.createdBy " +
           "WHERE po.id = :id")
    Optional<PurchaseOrder> findByIdWithDetails(@Param("id") Long id);

    boolean existsByPoNumber(String poNumber);

    boolean existsByRfqItemId(Long rfqItemId);
}
