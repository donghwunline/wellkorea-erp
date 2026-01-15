package com.wellkorea.backend.purchasing.infrastructure.persistence;

import com.wellkorea.backend.purchasing.domain.RfqItem;
import com.wellkorea.backend.purchasing.domain.RfqItemStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for RfqItem entities.
 */
@Repository
public interface RfqItemRepository extends JpaRepository<RfqItem, Long> {

    List<RfqItem> findByPurchaseRequestId(Long purchaseRequestId);

    List<RfqItem> findByVendorId(Long vendorId);

    List<RfqItem> findByPurchaseRequestIdAndStatus(Long purchaseRequestId, RfqItemStatus status);

    Optional<RfqItem> findByPurchaseRequestIdAndVendorId(Long purchaseRequestId, Long vendorId);

    @Query("SELECT ri FROM RfqItem ri " +
           "LEFT JOIN FETCH ri.vendor " +
           "LEFT JOIN FETCH ri.vendorOffering " +
           "WHERE ri.purchaseRequest.id = :purchaseRequestId")
    List<RfqItem> findByPurchaseRequestIdWithDetails(@Param("purchaseRequestId") Long purchaseRequestId);

    @Query("SELECT ri FROM RfqItem ri " +
           "LEFT JOIN FETCH ri.vendor " +
           "LEFT JOIN FETCH ri.purchaseRequest " +
           "WHERE ri.id = :id")
    Optional<RfqItem> findByIdWithDetails(@Param("id") Long id);

    boolean existsByPurchaseRequestIdAndStatus(Long purchaseRequestId, RfqItemStatus status);
}
