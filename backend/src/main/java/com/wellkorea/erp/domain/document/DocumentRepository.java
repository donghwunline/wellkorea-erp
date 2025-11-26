package com.wellkorea.erp.domain.document;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository for Document entity
 */
@Repository
public interface DocumentRepository extends JpaRepository<Document, UUID> {

    @Query("SELECT d FROM Document d WHERE d.archived = false AND d.jobcode.id = :jobcodeId ORDER BY d.uploadedAt DESC")
    List<Document> findByJobcodeId(@Param("jobcodeId") UUID jobcodeId);

    @Query("SELECT d FROM Document d WHERE d.archived = false AND d.product.id = :productId ORDER BY d.uploadedAt DESC")
    List<Document> findByProductId(@Param("productId") UUID productId);

    @Query("SELECT d FROM Document d WHERE d.archived = false AND d.customer.id = :customerId ORDER BY d.uploadedAt DESC")
    List<Document> findByCustomerId(@Param("customerId") UUID customerId);

    @Query("SELECT d FROM Document d WHERE d.archived = false AND d.documentType = :type ORDER BY d.uploadedAt DESC")
    List<Document> findByDocumentType(@Param("type") DocumentType type);

    @Query("SELECT d FROM Document d WHERE d.archived = false AND d.ownerType = :ownerType AND d.ownerId = :ownerId ORDER BY d.uploadedAt DESC")
    List<Document> findByOwner(@Param("ownerType") String ownerType, @Param("ownerId") UUID ownerId);

    @Query("SELECT d FROM Document d WHERE d.archived = false ORDER BY d.uploadedAt DESC")
    List<Document> findAllActive();
}
