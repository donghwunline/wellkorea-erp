package com.wellkorea.backend.company.application;

import com.wellkorea.backend.company.domain.Company;
import com.wellkorea.backend.company.domain.CompanyRole;
import com.wellkorea.backend.company.domain.RoleType;
import com.wellkorea.backend.company.infrastructure.persistence.CompanyRepository;
import com.wellkorea.backend.shared.exception.BusinessException;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Command service for company write operations.
 * Part of CQRS pattern - handles all create/update/delete operations.
 * Returns only entity IDs - clients should fetch fresh data via CompanyQueryService.
 */
@Service
@Transactional
public class CompanyCommandService {

    private final CompanyRepository companyRepository;

    public CompanyCommandService(CompanyRepository companyRepository) {
        this.companyRepository = companyRepository;
    }

    /**
     * Create a new company with initial roles.
     * Role presence validation handled by @NotEmpty on CreateCompanyRequest DTO.
     *
     * @param command The creation command
     * @return ID of the created company
     * @throws BusinessException if registration number is duplicate
     */
    public Long createCompany(CreateCompanyCommand command) {
        // Validate unique registration number
        if (command.registrationNumber() != null && !command.registrationNumber().isBlank()) {
            if (companyRepository.existsByRegistrationNumber(command.registrationNumber())) {
                throw new BusinessException("Company with this registration number already exists");
            }
        }

        // Create company
        Company company = Company.builder()
                .name(command.name())
                .registrationNumber(command.registrationNumber())
                .representative(command.representative())
                .businessType(command.businessType())
                .businessCategory(command.businessCategory())
                .contactPerson(command.contactPerson())
                .phone(command.phone())
                .email(command.email())
                .address(command.address())
                .bankAccount(command.bankAccount())
                .paymentTerms(command.paymentTerms())
                .build();

        // Add initial roles to company
        for (RoleType roleType : command.roles()) {
            CompanyRole role = CompanyRole.builder()
                    .roleType(roleType)
                    .build();
            company.addRole(role);
        }

        return companyRepository.save(company).getId();
    }

    /**
     * Update a company's information.
     *
     * @param companyId The company ID
     * @param command   The update command
     * @return ID of the updated company
     * @throws ResourceNotFoundException if company not found
     * @throws BusinessException         if new registration number is duplicate
     */
    public Long updateCompany(Long companyId, UpdateCompanyCommand command) {
        Company company = companyRepository.findByIdAndIsActiveTrue(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company", companyId));

        // Validate unique registration number if changing
        if (command.registrationNumber() != null && !command.registrationNumber().isBlank()) {
            if (companyRepository.existsByRegistrationNumberAndIdNot(command.registrationNumber(), companyId)) {
                throw new BusinessException("Company with this registration number already exists");
            }
        }

        company.update(
                command.name(),
                command.registrationNumber(),
                command.representative(),
                command.businessType(),
                command.businessCategory(),
                command.contactPerson(),
                command.phone(),
                command.email(),
                command.address(),
                command.bankAccount(),
                command.paymentTerms()
        );

        return companyRepository.save(company).getId();
    }

    /**
     * Add a role to a company.
     *
     * @param companyId The company ID
     * @param command   The role to add
     * @throws ResourceNotFoundException if company not found
     * @throws BusinessException         if company already has this role or max roles reached
     */
    public void addRole(Long companyId, AddRoleCommand command) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company", companyId));

        try {
            CompanyRole role = CompanyRole.builder()
                    .roleType(command.roleType())
                    .creditLimit(command.creditLimit())
                    .defaultPaymentDays(command.defaultPaymentDays())
                    .notes(command.notes())
                    .build();

            company.addRole(role);
            companyRepository.save(company);
        } catch (IllegalArgumentException | IllegalStateException e) {
            throw new BusinessException(e.getMessage());
        }
    }

    /**
     * Remove a role from a company.
     *
     * @param companyId The company ID
     * @param roleType  The role type to remove
     * @throws ResourceNotFoundException if company not found
     * @throws BusinessException         if this is the last role or role not found
     */
    public void removeRole(Long companyId, RoleType roleType) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company", companyId));

        try {
            company.removeRole(roleType);
            companyRepository.save(company);
        } catch (IllegalArgumentException | IllegalStateException e) {
            throw new BusinessException(e.getMessage());
        }
    }

    /**
     * Deactivate (soft delete) a company.
     *
     * @param companyId The company ID
     * @throws ResourceNotFoundException if company not found
     */
    public void deactivateCompany(Long companyId) {
        Company company = companyRepository.findByIdAndIsActiveTrue(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company", companyId));

        company.deactivate();
        companyRepository.save(company);
    }
}
