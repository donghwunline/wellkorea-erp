package com.wellkorea.backend.company.application;

import com.wellkorea.backend.company.domain.Company;
import com.wellkorea.backend.company.domain.CompanyRole;
import com.wellkorea.backend.company.domain.RoleType;
import com.wellkorea.backend.company.infrastructure.persistence.CompanyRepository;
import com.wellkorea.backend.company.infrastructure.persistence.CompanyRoleRepository;
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
    private final CompanyRoleRepository companyRoleRepository;

    public CompanyCommandService(CompanyRepository companyRepository, CompanyRoleRepository companyRoleRepository) {
        this.companyRepository = companyRepository;
        this.companyRoleRepository = companyRoleRepository;
    }

    /**
     * Create a new company with initial roles.
     *
     * @param command The creation command
     * @return ID of the created company
     * @throws BusinessException if registration number is duplicate or no roles specified
     */
    public Long createCompany(CreateCompanyCommand command) {
        // Validate at least one role
        if (command.roles() == null || command.roles().isEmpty()) {
            throw new BusinessException("At least one role must be specified for a company");
        }

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

        Company savedCompany = companyRepository.save(company);

        // Create roles and add to company
        for (RoleType roleType : command.roles()) {
            CompanyRole role = CompanyRole.builder()
                    .roleType(roleType)
                    .build();
            savedCompany.addRole(role);
        }

        // Save again to persist roles through cascade
        return companyRepository.save(savedCompany).getId();
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
     * @return ID of the created role
     * @throws ResourceNotFoundException if company not found
     * @throws BusinessException         if company already has this role
     */
    public Long addRole(Long companyId, AddRoleCommand command) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company", companyId));

        // Check for duplicate role
        if (companyRoleRepository.existsByCompany_IdAndRoleType(companyId, command.roleType())) {
            throw new BusinessException("Company already has role: " + command.roleType());
        }

        CompanyRole role = CompanyRole.builder()
                .company(company)
                .roleType(command.roleType())
                .creditLimit(command.creditLimit())
                .defaultPaymentDays(command.defaultPaymentDays())
                .notes(command.notes())
                .build();

        return companyRoleRepository.save(role).getId();
    }

    /**
     * Remove a role from a company.
     *
     * @param companyId The company ID
     * @param roleId    The role ID to remove
     * @throws ResourceNotFoundException if role not found
     * @throws BusinessException         if this is the last role
     */
    public void removeRole(Long companyId, Long roleId) {
        CompanyRole role = companyRoleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("CompanyRole", roleId));

        // Verify role belongs to this company
        if (!role.getCompanyId().equals(companyId)) {
            throw new BusinessException("Role does not belong to this company");
        }

        // Check if this is the last role
        long roleCount = companyRoleRepository.countByCompany_Id(companyId);
        if (roleCount <= 1) {
            throw new BusinessException("Cannot remove the last role from a company");
        }

        companyRoleRepository.delete(role);
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
