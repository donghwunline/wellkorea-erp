package com.wellkorea.backend.company.application;

import com.wellkorea.backend.company.domain.Company;
import com.wellkorea.backend.company.domain.CompanyRole;
import com.wellkorea.backend.company.domain.RoleType;
import com.wellkorea.backend.company.infrastructure.persistence.CompanyRepository;
import com.wellkorea.backend.shared.exception.BusinessException;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for CompanyCommandService.
 * Tests validate company management business logic for write operations.
 * <p>
 * Tests cover:
 * - Create company with roles
 * - Add role to existing company (via Company aggregate)
 * - Dual-role validation (same company can be customer AND vendor)
 * - Remove role by type (cannot remove last role)
 * - Registration number uniqueness
 */
@Tag("unit")
@ExtendWith(MockitoExtension.class)
@DisplayName("Company Command Service Unit Tests")
class CompanyCommandServiceTest {

    @Mock
    private CompanyRepository companyRepository;

    @InjectMocks
    private CompanyCommandService companyCommandService;

    // ==========================================================================
    // Create Company Tests
    // ==========================================================================

    @Nested
    @DisplayName("Create Company")
    class CreateCompanyTests {

        @Test
        @DisplayName("should create company with single CUSTOMER role")
        void createCompany_WithCustomerRole_ReturnsId() {
            // Given
            CreateCompanyCommand command = new CreateCompanyCommand(
                    "Samsung Electronics",
                    "123-45-67890",
                    "이재용",
                    "제조업",
                    "전자",
                    "홍길동",
                    "02-1234-5678",
                    "contact@samsung.com",
                    "서울시 강남구",
                    "신한은행 123-456-789012",
                    "NET30",
                    Set.of(RoleType.CUSTOMER)
            );

            Company savedCompany = createCompanyEntity(1L, "Samsung Electronics", "123-45-67890");
            when(companyRepository.existsByRegistrationNumber(anyString())).thenReturn(false);
            when(companyRepository.save(any(Company.class))).thenReturn(savedCompany);

            // When
            Long result = companyCommandService.createCompany(command);

            // Then
            assertThat(result).isEqualTo(1L);
            verify(companyRepository).save(any(Company.class));
        }

        @Test
        @DisplayName("should create company with multiple roles (CUSTOMER and VENDOR)")
        void createCompany_WithMultipleRoles_ReturnsId() {
            // Given
            CreateCompanyCommand command = new CreateCompanyCommand(
                    "Hyundai Parts",
                    "234-56-78901",
                    null, null, null,
                    "김철수",
                    "02-2345-6789",
                    "parts@hyundai.com",
                    null, null, null,
                    Set.of(RoleType.CUSTOMER, RoleType.VENDOR)
            );

            Company savedCompany = createCompanyEntity(2L, "Hyundai Parts", "234-56-78901");
            when(companyRepository.existsByRegistrationNumber(anyString())).thenReturn(false);
            when(companyRepository.save(any(Company.class))).thenReturn(savedCompany);

            // When
            Long result = companyCommandService.createCompany(command);

            // Then
            assertThat(result).isEqualTo(2L);
            verify(companyRepository).save(any(Company.class));
        }

        @Test
        @DisplayName("should throw exception when registration number already exists")
        void createCompany_DuplicateRegistrationNumber_ThrowsException() {
            // Given
            CreateCompanyCommand command = new CreateCompanyCommand(
                    "Duplicate Company",
                    "111-22-33333",
                    null, null, null, null, null, null, null, null, null,
                    Set.of(RoleType.CUSTOMER)
            );

            when(companyRepository.existsByRegistrationNumber("111-22-33333")).thenReturn(true);

            // When & Then
            assertThatThrownBy(() -> companyCommandService.createCompany(command))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("registration number");
        }

        // Note: Role presence validation is now handled by @NotEmpty on CreateCompanyRequest DTO
        // and tested in controller tests. Service layer trusts pre-validated input.

        @Test
        @DisplayName("should allow null registration number (not all companies have one)")
        void createCompany_NullRegistrationNumber_Succeeds() {
            // Given
            CreateCompanyCommand command = new CreateCompanyCommand(
                    "Foreign Company",
                    null, // No registration number
                    null, null, null, null, null, null, null, null, null,
                    Set.of(RoleType.VENDOR)
            );

            Company savedCompany = createCompanyEntity(3L, "Foreign Company", null);
            when(companyRepository.save(any(Company.class))).thenReturn(savedCompany);

            // When
            Long result = companyCommandService.createCompany(command);

            // Then
            assertThat(result).isEqualTo(3L);
            verify(companyRepository, never()).existsByRegistrationNumber(anyString());
            verify(companyRepository).save(any(Company.class));
        }
    }

    // ==========================================================================
    // Add Role Tests
    // ==========================================================================

    @Nested
    @DisplayName("Add Role to Company")
    class AddRoleTests {

        @Test
        @DisplayName("should add VENDOR role to existing company")
        void addRole_VendorToCompany_Succeeds() {
            // Given
            Long companyId = 1L;
            Company company = createCompanyWithRole(companyId, "Customer Company", RoleType.CUSTOMER);
            AddRoleCommand command = new AddRoleCommand(
                    RoleType.VENDOR,
                    new BigDecimal("10000000"),
                    30,
                    "Added as vendor"
            );

            when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));
            when(companyRepository.save(any(Company.class))).thenReturn(company);

            // When - no exception means success
            companyCommandService.addRole(companyId, command);

            // Then
            verify(companyRepository).save(company);
            assertThat(company.hasRole(RoleType.VENDOR)).isTrue();
        }

        @Test
        @DisplayName("should add OUTSOURCE role with notes")
        void addRole_Outsource_Succeeds() {
            // Given
            Long companyId = 2L;
            Company company = createCompanyWithRole(companyId, "Vendor Company", RoleType.VENDOR);
            AddRoleCommand command = new AddRoleCommand(
                    RoleType.OUTSOURCE,
                    null,
                    null,
                    "외주 도장 업체"
            );

            when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));
            when(companyRepository.save(any(Company.class))).thenReturn(company);

            // When
            companyCommandService.addRole(companyId, command);

            // Then
            verify(companyRepository).save(company);
            assertThat(company.hasRole(RoleType.OUTSOURCE)).isTrue();
        }

        @Test
        @DisplayName("should throw exception when company not found")
        void addRole_CompanyNotFound_ThrowsException() {
            // Given
            Long companyId = 99999L;
            AddRoleCommand command = new AddRoleCommand(RoleType.VENDOR, null, null, null);

            when(companyRepository.findById(companyId)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> companyCommandService.addRole(companyId, command))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("not found");
        }

        @Test
        @DisplayName("should throw exception when role already exists for company")
        void addRole_DuplicateRole_ThrowsException() {
            // Given
            Long companyId = 1L;
            Company company = createCompanyWithRole(companyId, "Customer Company", RoleType.CUSTOMER);
            AddRoleCommand command = new AddRoleCommand(RoleType.CUSTOMER, null, null, null);

            when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));

            // When & Then
            assertThatThrownBy(() -> companyCommandService.addRole(companyId, command))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("already has role");
        }
    }

    // ==========================================================================
    // Remove Role Tests
    // ==========================================================================

    @Nested
    @DisplayName("Remove Role from Company")
    class RemoveRoleTests {

        @Test
        @DisplayName("should remove VENDOR role from dual-role company")
        void removeRole_FromDualRoleCompany_Succeeds() {
            // Given
            Long companyId = 1L;
            Company company = createCompanyWithRoles(companyId, "Dual Role Company",
                    RoleType.CUSTOMER, RoleType.VENDOR);

            when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));
            when(companyRepository.save(any(Company.class))).thenReturn(company);

            // When
            companyCommandService.removeRole(companyId, RoleType.VENDOR);

            // Then
            verify(companyRepository).save(company);
            assertThat(company.hasRole(RoleType.VENDOR)).isFalse();
            assertThat(company.hasRole(RoleType.CUSTOMER)).isTrue();
        }

        @Test
        @DisplayName("should throw exception when trying to remove last role")
        void removeRole_LastRole_ThrowsException() {
            // Given
            Long companyId = 1L;
            Company company = createCompanyWithRole(companyId, "Single Role Company", RoleType.CUSTOMER);

            when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));

            // When & Then
            assertThatThrownBy(() -> companyCommandService.removeRole(companyId, RoleType.CUSTOMER))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("last role");
        }

        @Test
        @DisplayName("should throw exception when company not found")
        void removeRole_CompanyNotFound_ThrowsException() {
            // Given
            Long companyId = 99999L;

            when(companyRepository.findById(companyId)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> companyCommandService.removeRole(companyId, RoleType.VENDOR))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("not found");
        }

        @Test
        @DisplayName("should throw exception when role type not found on company")
        void removeRole_RoleTypeNotFound_ThrowsException() {
            // Given
            Long companyId = 1L;
            Company company = createCompanyWithRole(companyId, "Customer Company", RoleType.CUSTOMER);

            when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));

            // When & Then
            assertThatThrownBy(() -> companyCommandService.removeRole(companyId, RoleType.VENDOR))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("does not have role");
        }
    }

    // ==========================================================================
    // Update Company Tests
    // ==========================================================================

    @Nested
    @DisplayName("Update Company")
    class UpdateCompanyTests {

        @Test
        @DisplayName("should update company fields")
        void updateCompany_ValidUpdate_ReturnsId() {
            // Given
            Long companyId = 1L;
            Company existingCompany = createCompanyEntity(companyId, "Original Name", "111-22-33333");
            UpdateCompanyCommand command = new UpdateCompanyCommand(
                    "Updated Name",
                    null, // Keep existing registration number
                    null, null, null,
                    "New Contact",
                    "02-9999-8888",
                    "updated@company.com",
                    null, null, null
            );

            when(companyRepository.findByIdAndIsActiveTrue(companyId)).thenReturn(Optional.of(existingCompany));
            when(companyRepository.save(any(Company.class))).thenReturn(existingCompany);

            // When
            Long result = companyCommandService.updateCompany(companyId, command);

            // Then
            assertThat(result).isEqualTo(companyId);
            verify(companyRepository).save(any(Company.class));
        }

        @Test
        @DisplayName("should throw exception when updating to duplicate registration number")
        void updateCompany_DuplicateRegistrationNumber_ThrowsException() {
            // Given
            Long companyId = 1L;
            Company existingCompany = createCompanyEntity(companyId, "Company A", "111-22-33333");
            UpdateCompanyCommand command = new UpdateCompanyCommand(
                    null,
                    "222-33-44444", // Try to use existing number from another company
                    null, null, null, null, null, null, null, null, null
            );

            when(companyRepository.findByIdAndIsActiveTrue(companyId)).thenReturn(Optional.of(existingCompany));
            when(companyRepository.existsByRegistrationNumberAndIdNot("222-33-44444", companyId)).thenReturn(true);

            // When & Then
            assertThatThrownBy(() -> companyCommandService.updateCompany(companyId, command))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("registration number");
        }

        @Test
        @DisplayName("should throw exception when company not found")
        void updateCompany_CompanyNotFound_ThrowsException() {
            // Given
            Long companyId = 99999L;
            UpdateCompanyCommand command = new UpdateCompanyCommand(
                    "Updated Name",
                    null, null, null, null, null, null, null, null, null, null
            );

            when(companyRepository.findByIdAndIsActiveTrue(companyId)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> companyCommandService.updateCompany(companyId, command))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("not found");
        }
    }

    // ==========================================================================
    // Dual-Role Validation Tests
    // ==========================================================================

    @Nested
    @DisplayName("Dual-Role Validation")
    class DualRoleValidationTests {

        @Test
        @DisplayName("same company can have CUSTOMER and VENDOR roles")
        void dualRole_CustomerAndVendor_Allowed() {
            // Given
            CreateCompanyCommand command = new CreateCompanyCommand(
                    "Dual Role Company",
                    "555-66-77788",
                    null, null, null, null, null, null, null, null, null,
                    Set.of(RoleType.CUSTOMER, RoleType.VENDOR)
            );

            Company savedCompany = createCompanyEntity(1L, "Dual Role Company", "555-66-77788");
            when(companyRepository.existsByRegistrationNumber(anyString())).thenReturn(false);
            when(companyRepository.save(any(Company.class))).thenReturn(savedCompany);

            // When
            Long result = companyCommandService.createCompany(command);

            // Then
            assertThat(result).isEqualTo(1L);
            verify(companyRepository).save(any(Company.class));
        }

        @Test
        @DisplayName("same company can have all three roles")
        void dualRole_AllThreeRoles_Allowed() {
            // Given
            CreateCompanyCommand command = new CreateCompanyCommand(
                    "Triple Role Company",
                    "666-77-88899",
                    null, null, null, null, null, null, null, null, null,
                    Set.of(RoleType.CUSTOMER, RoleType.VENDOR, RoleType.OUTSOURCE)
            );

            Company savedCompany = createCompanyEntity(1L, "Triple Role Company", "666-77-88899");
            when(companyRepository.existsByRegistrationNumber(anyString())).thenReturn(false);
            when(companyRepository.save(any(Company.class))).thenReturn(savedCompany);

            // When
            Long result = companyCommandService.createCompany(command);

            // Then
            assertThat(result).isEqualTo(1L);
            verify(companyRepository).save(any(Company.class));
        }
    }

    // ==========================================================================
    // Helper Methods
    // ==========================================================================

    private Company createCompanyEntity(Long id, String name, String registrationNumber) {
        return Company.builder()
                .id(id)
                .name(name)
                .registrationNumber(registrationNumber)
                .isActive(true)
                .build();
    }

    private Company createCompanyWithRole(Long id, String name, RoleType roleType) {
        Company company = createCompanyEntity(id, name, null);
        CompanyRole role = CompanyRole.builder()
                .roleType(roleType)
                .build();
        company.addRole(role);
        return company;
    }

    private Company createCompanyWithRoles(Long id, String name, RoleType... roleTypes) {
        Company company = createCompanyEntity(id, name, null);
        for (RoleType roleType : roleTypes) {
            CompanyRole role = CompanyRole.builder()
                    .roleType(roleType)
                    .build();
            company.addRole(role);
        }
        return company;
    }
}
