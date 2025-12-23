package com.wellkorea.backend.company.infrastructure.persistence;

import com.wellkorea.backend.company.domain.CompanyRole;
import com.wellkorea.backend.company.domain.RoleType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for CompanyRole entity persistence.
 */
@Repository
public interface CompanyRoleRepository extends JpaRepository<CompanyRole, Long> {

    /**
     * Find all roles for a company.
     */
    List<CompanyRole> findByCompany_Id(Long companyId);

    /**
     * Check if a company has a specific role type.
     */
    boolean existsByCompany_IdAndRoleType(Long companyId, RoleType roleType);

    /**
     * Count roles for a company.
     */
    long countByCompany_Id(Long companyId);

    /**
     * Find a specific role for a company.
     */
    Optional<CompanyRole> findByCompany_IdAndRoleType(Long companyId, RoleType roleType);

    /**
     * Delete all roles for a company.
     */
    void deleteByCompany_Id(Long companyId);
}
