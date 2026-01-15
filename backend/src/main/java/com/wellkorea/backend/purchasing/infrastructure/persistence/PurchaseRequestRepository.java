package com.wellkorea.backend.purchasing.infrastructure.persistence;

import com.wellkorea.backend.purchasing.domain.PurchaseRequest;
import com.wellkorea.backend.purchasing.domain.PurchaseRequestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for PurchaseRequest entities.
 */
@Repository
public interface PurchaseRequestRepository extends JpaRepository<PurchaseRequest, Long> {

    Optional<PurchaseRequest> findByRequestNumber(String requestNumber);

    Page<PurchaseRequest> findByProjectId(Long projectId, Pageable pageable);

    Page<PurchaseRequest> findByStatus(PurchaseRequestStatus status, Pageable pageable);

    Page<PurchaseRequest> findByProjectIdAndStatus(Long projectId, PurchaseRequestStatus status, Pageable pageable);

    List<PurchaseRequest> findByServiceCategoryId(Long serviceCategoryId);

    @Query("SELECT MAX(CAST(SUBSTRING(pr.requestNumber, 9) AS int)) FROM PurchaseRequest pr WHERE pr.requestNumber LIKE :prefix%")
    Integer findMaxSequenceForYear(@Param("prefix") String prefix);

    @Query("SELECT pr FROM PurchaseRequest pr " +
           "LEFT JOIN FETCH pr.serviceCategory " +
           "LEFT JOIN FETCH pr.project " +
           "LEFT JOIN FETCH pr.createdBy " +
           "WHERE pr.id = :id")
    Optional<PurchaseRequest> findByIdWithDetails(@Param("id") Long id);

    boolean existsByRequestNumber(String requestNumber);
}
