package com.wellkorea.backend.auth.infrastructure.persistence;

import com.wellkorea.backend.auth.domain.CustomerAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for customer assignment operations.
 * Supports Sales role customer filtering per FR-062.
 */
@Repository
public interface CustomerAssignmentRepository extends JpaRepository<CustomerAssignment, Long> {

    /**
     * Find all customer IDs assigned to a specific user.
     * Used for filtering projects/quotations by Sales role.
     */
    @Query("SELECT ca.customerId FROM CustomerAssignment ca WHERE ca.userId = :userId")
    List<Long> findCustomerIdsByUserId(@Param("userId") Long userId);

    /**
     * Find all customer assignments for a specific user.
     */
    List<CustomerAssignment> findByUserId(Long userId);

    /**
     * Delete all assignments for a specific user.
     */
    void deleteByUserId(Long userId);
}
