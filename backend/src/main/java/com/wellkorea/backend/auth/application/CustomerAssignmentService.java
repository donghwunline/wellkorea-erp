package com.wellkorea.backend.auth.application;

import com.wellkorea.backend.auth.domain.CustomerAssignment;
import com.wellkorea.backend.auth.infrastructure.persistence.CustomerAssignmentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service for managing customer assignments (Sales role filtering per FR-062).
 */
@Service
@Transactional
public class CustomerAssignmentService {

    private final CustomerAssignmentRepository customerAssignmentRepository;

    public CustomerAssignmentService(CustomerAssignmentRepository customerAssignmentRepository) {
        this.customerAssignmentRepository = customerAssignmentRepository;
    }

    /**
     * Get all customer IDs assigned to a user.
     * Used for filtering projects/quotations for Sales role.
     */
    @Transactional(readOnly = true)
    public List<Long> getAssignedCustomerIds(Long userId) {
        return customerAssignmentRepository.findCustomerIdsByUserId(userId);
    }

    /**
     * Get all customer assignments for a user.
     */
    @Transactional(readOnly = true)
    public List<CustomerAssignment> getUserAssignments(Long userId) {
        return customerAssignmentRepository.findByUserId(userId);
    }

    /**
     * Assign a customer to a user.
     */
    public CustomerAssignment assignCustomer(Long userId, Long customerId) {
        CustomerAssignment assignment = CustomerAssignment.builder()
                .userId(userId)
                .customerId(customerId)
                .build();
        return customerAssignmentRepository.save(assignment);
    }

    /**
     * Replace all customer assignments for a user.
     * Removes existing assignments and creates new ones.
     */
    public List<CustomerAssignment> replaceUserAssignments(Long userId, List<Long> customerIds) {
        // Remove existing assignments
        customerAssignmentRepository.deleteByUserId(userId);

        // Create new assignments
        List<CustomerAssignment> assignments = customerIds.stream()
                .map(customerId -> CustomerAssignment.builder()
                        .userId(userId)
                        .customerId(customerId)
                        .build())
                .toList();

        return customerAssignmentRepository.saveAll(assignments);
    }
}
