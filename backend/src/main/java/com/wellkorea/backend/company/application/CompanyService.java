package com.wellkorea.backend.company.application;

import com.wellkorea.backend.company.domain.Company;
import com.wellkorea.backend.company.domain.CompanyRole;
import com.wellkorea.backend.company.domain.RoleType;
import com.wellkorea.backend.company.infrastructure.persistence.CompanyRepository;
import com.wellkorea.backend.company.infrastructure.persistence.CompanyRoleRepository;
import com.wellkorea.backend.shared.exception.BusinessException;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Service for managing companies and their roles.
 * Handles business logic for the unified Company domain.
 */
@Service
public class CompanyService {

    private final CompanyRepository companyRepository;
    private final CompanyRoleRepository companyRoleRepository;

    public CompanyService(CompanyRepository companyRepository, CompanyRoleRepository companyRoleRepository) {
        this.companyRepository = companyRepository;
        this.companyRoleRepository = companyRoleRepository;
    }

    // ========== COMMAND OPERATIONS ==========

    /**
     * Create a new company with initial roles.
     *
     * @param command The creation command
     * @return The created company
     * @throws BusinessException if registration number is duplicate or no roles specified
     */
    @Transactional
    public Company createCompany(CreateCompanyCommand command) {
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
                    .company(savedCompany)
                    .roleType(roleType)
                    .build();
            savedCompany.getRoles().add(role);
        }

        // Save again to persist roles through cascade
        return companyRepository.save(savedCompany);
    }

    /**
     * Update a company's information.
     *
     * @param companyId The company ID
     * @param command   The update command
     * @return The updated company
     * @throws ResourceNotFoundException if company not found
     * @throws BusinessException         if new registration number is duplicate
     */
    @Transactional
    public Company updateCompany(Long companyId, UpdateCompanyCommand command) {
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

        return companyRepository.save(company);
    }

    /**
     * Add a role to a company.
     *
     * @param companyId The company ID
     * @param command   The role to add
     * @return The created role
     * @throws ResourceNotFoundException if company not found
     * @throws BusinessException         if company already has this role
     */
    @Transactional
    public CompanyRole addRole(Long companyId, AddRoleCommand command) {
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

        return companyRoleRepository.save(role);
    }

    /**
     * Remove a role from a company.
     *
     * @param companyId The company ID
     * @param roleId    The role ID to remove
     * @throws ResourceNotFoundException if role not found
     * @throws BusinessException         if this is the last role
     */
    @Transactional
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
    @Transactional
    public void deactivateCompany(Long companyId) {
        Company company = companyRepository.findByIdAndIsActiveTrue(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company", companyId));

        company.deactivate();
        companyRepository.save(company);
    }

    // ========== QUERY OPERATIONS ==========

    /**
     * Find a company by ID.
     *
     * @param companyId The company ID
     * @return The company if found
     */
    @Transactional(readOnly = true)
    public Optional<Company> findById(Long companyId) {
        return companyRepository.findByIdAndIsActiveTrue(companyId);
    }

    /**
     * Get a company by ID, throwing exception if not found.
     * Eagerly loads roles.
     *
     * @param companyId The company ID
     * @return The company with roles loaded
     * @throws ResourceNotFoundException if company not found
     */
    @Transactional(readOnly = true)
    public Company getById(Long companyId) {
        return companyRepository.findByIdWithRoles(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company", companyId));
    }

    /**
     * Find all active companies with pagination.
     *
     * @param pageable Pagination parameters
     * @return Page of companies
     */
    @Transactional(readOnly = true)
    public Page<Company> findAll(Pageable pageable) {
        return companyRepository.findByIsActiveTrue(pageable);
    }

    /**
     * Find companies by name search.
     *
     * @param search   Search term
     * @param pageable Pagination parameters
     * @return Page of matching companies
     */
    @Transactional(readOnly = true)
    public Page<Company> findBySearch(String search, Pageable pageable) {
        if (search == null || search.isBlank()) {
            return findAll(pageable);
        }
        return companyRepository.findByNameContainingIgnoreCase(search, pageable);
    }

    /**
     * Find companies by role type.
     *
     * @param roleType The role type to filter by
     * @param pageable Pagination parameters
     * @return Page of companies with the specified role
     */
    @Transactional(readOnly = true)
    public Page<Company> findByRoleType(RoleType roleType, Pageable pageable) {
        return companyRepository.findByRoleType(roleType, pageable);
    }

    /**
     * Find companies by role type with search.
     *
     * @param roleType The role type to filter by
     * @param search   Search term
     * @param pageable Pagination parameters
     * @return Page of matching companies
     */
    @Transactional(readOnly = true)
    public Page<Company> findByRoleTypeAndSearch(RoleType roleType, String search, Pageable pageable) {
        if (search == null || search.isBlank()) {
            return findByRoleType(roleType, pageable);
        }
        return companyRepository.findByRoleTypeAndNameContaining(roleType, search, pageable);
    }

    /**
     * Get roles for a company.
     *
     * @param companyId The company ID
     * @return List of roles
     */
    @Transactional(readOnly = true)
    public List<CompanyRole> getRoles(Long companyId) {
        return companyRoleRepository.findByCompany_Id(companyId);
    }

    /**
     * Check if a company exists and is active.
     *
     * @param companyId The company ID
     * @return true if the company exists and is active
     */
    @Transactional(readOnly = true)
    public boolean existsAndActive(Long companyId) {
        return companyRepository.existsByIdAndIsActiveTrue(companyId);
    }
}
