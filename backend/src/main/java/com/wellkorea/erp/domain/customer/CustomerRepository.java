package com.wellkorea.erp.domain.customer;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository for Customer entity
 */
@Repository
public interface CustomerRepository extends JpaRepository<Customer, UUID> {

    List<Customer> findByActiveTrue();

    @Query("SELECT c FROM Customer c WHERE c.active = true AND " +
            "(LOWER(c.companyName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(c.contactPerson) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    List<Customer> searchActiveCustomers(String searchTerm);

    boolean existsByCompanyName(String companyName);
}
