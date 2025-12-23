package com.wellkorea.backend.company.application;

import com.wellkorea.backend.company.domain.Company;
import com.wellkorea.backend.company.domain.CompanyRole;
import com.wellkorea.backend.company.domain.RoleType;
import com.wellkorea.backend.company.infrastructure.persistence.CompanyRepository;
import com.wellkorea.backend.company.infrastructure.persistence.CompanyRoleRepository;
import com.wellkorea.backend.shared.exception.BusinessException;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for CompanyService.
 * Tests validate company management business logic.
 * <p>
 * Test-First Development: These tests MUST be written FIRST and MUST FAIL initially.
 * Per Constitution Principle I (Test-First Development).
 * <p>
 * T052d: Unit tests for CompanyService
 * - Create company with roles
 * - Add role to existing company
 * - Dual-role validation (same company can be customer AND vendor)
 * - Remove role (cannot remove last role)
 * - Registration number uniqueness
 */
@Tag("unit")
@ExtendWith(MockitoExtension.class)
@DisplayName("Company Service Unit Tests")
class CompanyServiceTest {

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private CompanyRoleRepository companyRoleRepository;

    @InjectMocks
    private CompanyService companyService;

    // ==========================================================================
    // Create Company Tests
    // ==========================================================================

    @Nested
    @DisplayName("Create Company")
    class CreateCompanyTests {

        @Test
        @DisplayName("should create company with single CUSTOMER role")
        void createCompany_WithCustomerRole_ReturnsCompany() {
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
            Company result = companyService.createCompany(command);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getName()).isEqualTo("Samsung Electronics");
            // Company is saved twice: once initially, once after adding roles
            verify(companyRepository, times(2)).save(any(Company.class));
        }

        @Test
        @DisplayName("should create company with multiple roles (CUSTOMER and VENDOR)")
        void createCompany_WithMultipleRoles_ReturnsCompanyWithRoles() {
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
            Company result = companyService.createCompany(command);

            // Then
            assertThat(result).isNotNull();
            // Company is saved twice: once initially, once after adding roles
            verify(companyRepository, times(2)).save(any(Company.class));
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
            assertThatThrownBy(() -> companyService.createCompany(command))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("registration number");
        }

        @Test
        @DisplayName("should throw exception when roles set is empty")
        void createCompany_EmptyRoles_ThrowsException() {
            // Given
            CreateCompanyCommand command = new CreateCompanyCommand(
                    "No Role Company",
                    "222-33-44444",
                    null, null, null, null, null, null, null, null, null,
                    Set.of() // Empty roles
            );

            // When & Then
            assertThatThrownBy(() -> companyService.createCompany(command))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("At least one role");
        }

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
            Company result = companyService.createCompany(command);

            // Then
            assertThat(result).isNotNull();
            verify(companyRepository, never()).existsByRegistrationNumber(anyString());
            // Company is saved twice: once initially, once after adding roles
            verify(companyRepository, times(2)).save(any(Company.class));
        }
    }

    // ==========================================================================
    // Add Role Tests
    // ==========================================================================

    @Nested
    @DisplayName("Add Role to Company")
    class AddRoleTests {

        @Test
        @DisplayName("should add VENDOR role to existing CUSTOMER company")
        void addRole_VendorToCustomer_ReturnsRole() {
            // Given
            Long companyId = 1L;
            Company company = createCompanyEntity(companyId, "Customer Company", "111-22-33333");
            AddRoleCommand command = new AddRoleCommand(
                    RoleType.VENDOR,
                    new BigDecimal("10000000"),
                    30,
                    "Added as vendor"
            );

            when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));
            when(companyRoleRepository.existsByCompany_IdAndRoleType(companyId, RoleType.VENDOR)).thenReturn(false);
            when(companyRoleRepository.save(any(CompanyRole.class))).thenAnswer(i -> i.getArgument(0));

            // When
            CompanyRole result = companyService.addRole(companyId, command);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getRoleType()).isEqualTo(RoleType.VENDOR);
            assertThat(result.getCreditLimit()).isEqualByComparingTo(new BigDecimal("10000000"));
            verify(companyRoleRepository).save(any(CompanyRole.class));
        }

        @Test
        @DisplayName("should add OUTSOURCE role with notes")
        void addRole_Outsource_ReturnsRole() {
            // Given
            Long companyId = 2L;
            Company company = createCompanyEntity(companyId, "Vendor Company", "222-33-44444");
            AddRoleCommand command = new AddRoleCommand(
                    RoleType.OUTSOURCE,
                    null,
                    null,
                    "외주 도장 업체"
            );

            when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));
            when(companyRoleRepository.existsByCompany_IdAndRoleType(companyId, RoleType.OUTSOURCE)).thenReturn(false);
            when(companyRoleRepository.save(any(CompanyRole.class))).thenAnswer(i -> i.getArgument(0));

            // When
            CompanyRole result = companyService.addRole(companyId, command);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getRoleType()).isEqualTo(RoleType.OUTSOURCE);
            assertThat(result.getNotes()).isEqualTo("외주 도장 업체");
        }

        @Test
        @DisplayName("should throw exception when company not found")
        void addRole_CompanyNotFound_ThrowsException() {
            // Given
            Long companyId = 99999L;
            AddRoleCommand command = new AddRoleCommand(RoleType.VENDOR, null, null, null);

            when(companyRepository.findById(companyId)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> companyService.addRole(companyId, command))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("not found");
        }

        @Test
        @DisplayName("should throw exception when role already exists for company")
        void addRole_DuplicateRole_ThrowsException() {
            // Given
            Long companyId = 1L;
            Company company = createCompanyEntity(companyId, "Customer Company", "111-22-33333");
            AddRoleCommand command = new AddRoleCommand(RoleType.CUSTOMER, null, null, null);

            when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));
            when(companyRoleRepository.existsByCompany_IdAndRoleType(companyId, RoleType.CUSTOMER)).thenReturn(true);

            // When & Then
            assertThatThrownBy(() -> companyService.addRole(companyId, command))
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
            Long roleId = 10L;
            CompanyRole vendorRole = createCompanyRole(roleId, companyId, RoleType.VENDOR);

            when(companyRoleRepository.findById(roleId)).thenReturn(Optional.of(vendorRole));
            when(companyRoleRepository.countByCompany_Id(companyId)).thenReturn(2L); // Has 2 roles

            // When
            companyService.removeRole(companyId, roleId);

            // Then
            verify(companyRoleRepository).delete(vendorRole);
        }

        @Test
        @DisplayName("should throw exception when trying to remove last role")
        void removeRole_LastRole_ThrowsException() {
            // Given
            Long companyId = 1L;
            Long roleId = 10L;
            CompanyRole lastRole = createCompanyRole(roleId, companyId, RoleType.CUSTOMER);

            when(companyRoleRepository.findById(roleId)).thenReturn(Optional.of(lastRole));
            when(companyRoleRepository.countByCompany_Id(companyId)).thenReturn(1L); // Only 1 role

            // When & Then
            assertThatThrownBy(() -> companyService.removeRole(companyId, roleId))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("last role");
        }

        @Test
        @DisplayName("should throw exception when role not found")
        void removeRole_RoleNotFound_ThrowsException() {
            // Given
            Long companyId = 1L;
            Long roleId = 99999L;

            when(companyRoleRepository.findById(roleId)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> companyService.removeRole(companyId, roleId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("not found");
        }

        @Test
        @DisplayName("should throw exception when role belongs to different company")
        void removeRole_RoleBelongsToDifferentCompany_ThrowsException() {
            // Given
            Long companyId = 1L;
            Long roleId = 10L;
            CompanyRole roleFromOtherCompany = createCompanyRole(roleId, 2L, RoleType.VENDOR);

            when(companyRoleRepository.findById(roleId)).thenReturn(Optional.of(roleFromOtherCompany));

            // When & Then
            assertThatThrownBy(() -> companyService.removeRole(companyId, roleId))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("does not belong");
        }
    }

    // ==========================================================================
    // Find Company Tests
    // ==========================================================================

    @Nested
    @DisplayName("Find Company")
    class FindCompanyTests {

        @Test
        @DisplayName("should find company by ID")
        void findById_ExistingCompany_ReturnsCompany() {
            // Given
            Long companyId = 1L;
            Company company = createCompanyEntity(companyId, "Samsung", "123-45-67890");

            when(companyRepository.findByIdAndIsActiveTrue(companyId)).thenReturn(Optional.of(company));

            // When
            Optional<Company> result = companyService.findById(companyId);

            // Then
            assertThat(result).isPresent();
            assertThat(result.get().getName()).isEqualTo("Samsung");
            verify(companyRepository).findByIdAndIsActiveTrue(companyId);
        }

        @Test
        @DisplayName("should return empty when company not found")
        void findById_NonExistentCompany_ReturnsEmpty() {
            // Given
            Long companyId = 99999L;
            when(companyRepository.findByIdAndIsActiveTrue(companyId)).thenReturn(Optional.empty());

            // When
            Optional<Company> result = companyService.findById(companyId);

            // Then
            assertThat(result).isEmpty();
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
        void updateCompany_ValidUpdate_ReturnsUpdatedCompany() {
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
            when(companyRepository.save(any(Company.class))).thenAnswer(i -> i.getArgument(0));

            // When
            Company result = companyService.updateCompany(companyId, command);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getName()).isEqualTo("Updated Name");
            assertThat(result.getContactPerson()).isEqualTo("New Contact");
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
            assertThatThrownBy(() -> companyService.updateCompany(companyId, command))
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
            assertThatThrownBy(() -> companyService.updateCompany(companyId, command))
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
            Company result = companyService.createCompany(command);

            // Then
            assertThat(result).isNotNull();
            // Company is saved twice: once initially, once after adding roles
            verify(companyRepository, times(2)).save(any(Company.class));
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
            Company result = companyService.createCompany(command);

            // Then
            assertThat(result).isNotNull();
            // Company is saved twice: once initially, once after adding roles
            verify(companyRepository, times(2)).save(any(Company.class));
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

    private CompanyRole createCompanyRole(Long id, Long companyId, RoleType roleType) {
        Company company = createCompanyEntity(companyId, "Test Company", null);
        return CompanyRole.builder()
                .id(id)
                .company(company)
                .roleType(roleType)
                .build();
    }
}
