package com.wellkorea.erp.domain.jobcode;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for JobCode entity
 */
@Repository
public interface JobCodeRepository extends JpaRepository<JobCode, UUID> {

    Optional<JobCode> findByJobcode(String jobcode);

    boolean existsByJobcode(String jobcode);

    @Query("SELECT j FROM JobCode j WHERE j.deletedAt IS NULL ORDER BY j.createdAt DESC")
    List<JobCode> findAllActive();

    @Query("SELECT j FROM JobCode j WHERE j.deletedAt IS NULL AND j.status = :status ORDER BY j.createdAt DESC")
    List<JobCode> findByStatus(@Param("status") JobCodeStatus status);

    @Query("SELECT j FROM JobCode j WHERE j.deletedAt IS NULL AND j.customer.id = :customerId ORDER BY j.createdAt DESC")
    List<JobCode> findByCustomerId(@Param("customerId") UUID customerId);

    @Query("SELECT j FROM JobCode j WHERE j.deletedAt IS NULL AND j.internalOwner.id = :ownerId ORDER BY j.createdAt DESC")
    List<JobCode> findByInternalOwnerId(@Param("ownerId") UUID ownerId);

    @Query("SELECT j FROM JobCode j WHERE j.deletedAt IS NULL AND " +
            "(LOWER(j.jobcode) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(j.projectName) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    List<JobCode> searchActive(@Param("searchTerm") String searchTerm);
}
