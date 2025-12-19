package com.wellkorea.backend.customer.infrastructure.repository;

import com.wellkorea.backend.customer.domain.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository for Customer entity persistence.
 * Provides query methods for customer management.
 */
@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {

    /**
     * Check if a non-deleted customer exists by ID.
     *
     * @param id Customer ID to check
     * @return true if a non-deleted customer exists with the given ID
     */
    boolean existsByIdAndIsDeletedFalse(Long id);
}
