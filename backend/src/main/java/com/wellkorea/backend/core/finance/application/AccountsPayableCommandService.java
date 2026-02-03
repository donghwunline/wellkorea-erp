package com.wellkorea.backend.core.finance.application;

import com.wellkorea.backend.core.finance.domain.AccountsPayable;
import com.wellkorea.backend.core.finance.infrastructure.persistence.AccountsPayableRepository;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

/**
 * Command service for accounts payable write operations.
 * Part of CQRS pattern - handles create/update/delete operations.
 *
 * <p>Note: AP records are primarily created via domain events (e.g., PO confirmation).
 * This service handles manual updates like setting due dates.
 */
@Service
@Transactional
public class AccountsPayableCommandService {

    private final AccountsPayableRepository repository;

    public AccountsPayableCommandService(AccountsPayableRepository repository) {
        this.repository = repository;
    }

    /**
     * Update AP metadata (due date, notes).
     *
     * @param apId    The AP ID to update
     * @param dueDate New due date (null to clear)
     * @param notes   New notes (null to clear)
     * @param userId  The user making the update
     * @return The updated AP ID
     * @throws ResourceNotFoundException if AP not found
     */
    public Long updateMetadata(Long apId, LocalDate dueDate, String notes, Long userId) {
        AccountsPayable ap = repository.findById(apId)
                .orElseThrow(() -> new ResourceNotFoundException("AccountsPayable", apId));

        ap.setDueDate(dueDate);
        ap.setNotes(notes);

        repository.save(ap);

        return ap.getId();
    }
}
