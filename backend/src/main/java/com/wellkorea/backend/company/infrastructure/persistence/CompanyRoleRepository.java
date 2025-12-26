package com.wellkorea.backend.company.infrastructure.persistence;

import com.wellkorea.backend.company.domain.CompanyRole;
import com.wellkorea.backend.company.domain.RoleType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository for CompanyRole entity write operations (CQRS Command side).
 *
 * <p>For read operations, company roles are fetched via {@code CompanyMapper.findDetailById()}
 * which includes nested role queries.
 *
 * <p>This repository provides:
 * <ul>
 *   <li>Save/delete operations (inherited from JpaRepository)</li>
 *   <li>Role existence and count validation</li>
 * </ul>
 */
@Repository
public interface CompanyRoleRepository extends JpaRepository<CompanyRole, Long> {

    /**
     * Check if a company has a specific role type.
     * Used by CommandService to prevent duplicate role assignment.
     *
     * @param companyId Company ID
     * @param roleType Role type to check
     * @return true if company already has this role type
     */
    boolean existsByCompany_IdAndRoleType(Long companyId, RoleType roleType);

    /**
     * Count roles for a company.
     * Used by CommandService to prevent deletion of last role.
     *
     * @param companyId Company ID
     * @return Number of roles assigned to the company
     */
    long countByCompany_Id(Long companyId);
}
