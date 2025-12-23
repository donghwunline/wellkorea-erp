package com.wellkorea.backend.catalog.application;

import com.wellkorea.backend.catalog.domain.ServiceCategory;
import com.wellkorea.backend.catalog.domain.VendorServiceOffering;
import com.wellkorea.backend.catalog.infrastructure.persistence.ServiceCategoryRepository;
import com.wellkorea.backend.catalog.infrastructure.persistence.VendorServiceOfferingRepository;
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
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for ServiceCategoryCommandService.
 * Tests validate service category and vendor offering business logic for write operations.
 * <p>
 * Test-First Development: These tests MUST be written FIRST and MUST FAIL initially.
 * Per Constitution Principle I (Test-First Development).
 */
@Tag("unit")
@ExtendWith(MockitoExtension.class)
@DisplayName("Service Category Command Service Unit Tests")
class ServiceCategoryCommandServiceTest {

    @Mock
    private ServiceCategoryRepository serviceCategoryRepository;

    @Mock
    private VendorServiceOfferingRepository vendorOfferingRepository;

    @Mock
    private CompanyRepository companyRepository;

    @InjectMocks
    private ServiceCategoryCommandService commandService;

    // ==========================================================================
    // Create Service Category Tests
    // ==========================================================================

    @Nested
    @DisplayName("Create Service Category")
    class CreateServiceCategoryTests {

        @Test
        @DisplayName("should create service category and return ID")
        void createServiceCategory_ValidData_ReturnsId() {
            // Given
            CreateServiceCategoryCommand command = new CreateServiceCategoryCommand(
                    "CNC Machining",
                    "Computer Numerical Control machining services"
            );

            ServiceCategory savedCategory = createServiceCategory(1L, "CNC Machining", true);

            when(serviceCategoryRepository.existsByName("CNC Machining")).thenReturn(false);
            when(serviceCategoryRepository.save(any(ServiceCategory.class))).thenReturn(savedCategory);

            // When
            Long result = commandService.createServiceCategory(command);

            // Then
            assertThat(result).isEqualTo(1L);
            verify(serviceCategoryRepository).save(any(ServiceCategory.class));
        }

        @Test
        @DisplayName("should create service category with null description")
        void createServiceCategory_NullDescription_ReturnsId() {
            // Given
            CreateServiceCategoryCommand command = new CreateServiceCategoryCommand(
                    "Laser Cutting",
                    null
            );

            ServiceCategory savedCategory = createServiceCategory(2L, "Laser Cutting", true);

            when(serviceCategoryRepository.existsByName("Laser Cutting")).thenReturn(false);
            when(serviceCategoryRepository.save(any(ServiceCategory.class))).thenReturn(savedCategory);

            // When
            Long result = commandService.createServiceCategory(command);

            // Then
            assertThat(result).isEqualTo(2L);
        }

        @Test
        @DisplayName("should throw exception when name is duplicate")
        void createServiceCategory_DuplicateName_ThrowsException() {
            // Given
            CreateServiceCategoryCommand command = new CreateServiceCategoryCommand(
                    "Existing Category",
                    null
            );

            when(serviceCategoryRepository.existsByName("Existing Category")).thenReturn(true);

            // When & Then
            assertThatThrownBy(() -> commandService.createServiceCategory(command))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Existing Category")
                    .hasMessageContaining("already exists");
        }

        @Test
        @DisplayName("should set service category as active by default")
        void createServiceCategory_SetsActiveTrue() {
            // Given
            CreateServiceCategoryCommand command = new CreateServiceCategoryCommand(
                    "New Category",
                    "Description"
            );

            when(serviceCategoryRepository.existsByName("New Category")).thenReturn(false);
            when(serviceCategoryRepository.save(any(ServiceCategory.class))).thenAnswer(invocation -> {
                ServiceCategory category = invocation.getArgument(0);
                assertThat(category.isActive()).isTrue();
                category.setId(1L);
                return category;
            });

            // When
            Long result = commandService.createServiceCategory(command);

            // Then
            assertThat(result).isEqualTo(1L);
        }
    }

    // ==========================================================================
    // Update Service Category Tests
    // ==========================================================================

    @Nested
    @DisplayName("Update Service Category")
    class UpdateServiceCategoryTests {

        @Test
        @DisplayName("should update all service category fields")
        void updateServiceCategory_AllFields_ReturnsId() {
            // Given
            Long categoryId = 1L;
            ServiceCategory existingCategory = createServiceCategory(categoryId, "Old Name", true);

            UpdateServiceCategoryCommand command = new UpdateServiceCategoryCommand(
                    "New Name",
                    "New Description",
                    false
            );

            when(serviceCategoryRepository.findById(categoryId)).thenReturn(Optional.of(existingCategory));
            when(serviceCategoryRepository.existsByNameAndIdNot("New Name", categoryId)).thenReturn(false);
            when(serviceCategoryRepository.save(any(ServiceCategory.class))).thenReturn(existingCategory);

            // When
            Long result = commandService.updateServiceCategory(categoryId, command);

            // Then
            assertThat(result).isEqualTo(categoryId);
            verify(serviceCategoryRepository).save(any(ServiceCategory.class));
        }

        @Test
        @DisplayName("should update only provided fields (partial update)")
        void updateServiceCategory_PartialUpdate_OnlyUpdatesProvidedFields() {
            // Given
            Long categoryId = 1L;
            ServiceCategory existingCategory = createServiceCategory(categoryId, "Original Name", true);
            existingCategory.setDescription("Original Description");

            UpdateServiceCategoryCommand command = new UpdateServiceCategoryCommand(
                    null, // Keep existing name
                    "Updated Description",
                    null  // Keep existing active status
            );

            when(serviceCategoryRepository.findById(categoryId)).thenReturn(Optional.of(existingCategory));
            when(serviceCategoryRepository.save(any(ServiceCategory.class))).thenAnswer(invocation -> {
                ServiceCategory category = invocation.getArgument(0);
                assertThat(category.getName()).isEqualTo("Original Name"); // Unchanged
                assertThat(category.getDescription()).isEqualTo("Updated Description"); // Updated
                return category;
            });

            // When
            Long result = commandService.updateServiceCategory(categoryId, command);

            // Then
            assertThat(result).isEqualTo(categoryId);
            verify(serviceCategoryRepository, never()).existsByNameAndIdNot(anyString(), anyLong());
        }

        @Test
        @DisplayName("should throw exception when updating to duplicate name")
        void updateServiceCategory_DuplicateName_ThrowsException() {
            // Given
            Long categoryId = 1L;
            ServiceCategory existingCategory = createServiceCategory(categoryId, "Original Name", true);

            UpdateServiceCategoryCommand command = new UpdateServiceCategoryCommand(
                    "Existing Name", // Another category's name
                    null, null
            );

            when(serviceCategoryRepository.findById(categoryId)).thenReturn(Optional.of(existingCategory));
            when(serviceCategoryRepository.existsByNameAndIdNot("Existing Name", categoryId)).thenReturn(true);

            // When & Then
            assertThatThrownBy(() -> commandService.updateServiceCategory(categoryId, command))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Existing Name")
                    .hasMessageContaining("already exists");
        }

        @Test
        @DisplayName("should throw exception when category not found")
        void updateServiceCategory_CategoryNotFound_ThrowsException() {
            // Given
            Long categoryId = 99999L;
            UpdateServiceCategoryCommand command = new UpdateServiceCategoryCommand(
                    "New Name", null, null
            );

            when(serviceCategoryRepository.findById(categoryId)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> commandService.updateServiceCategory(categoryId, command))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("ServiceCategory");
        }
    }

    // ==========================================================================
    // Deactivate Service Category Tests
    // ==========================================================================

    @Nested
    @DisplayName("Deactivate Service Category")
    class DeactivateServiceCategoryTests {

        @Test
        @DisplayName("should deactivate active service category")
        void deactivateServiceCategory_ActiveCategory_SetsInactive() {
            // Given
            Long categoryId = 1L;
            ServiceCategory activeCategory = createServiceCategory(categoryId, "Active Category", true);

            when(serviceCategoryRepository.findById(categoryId)).thenReturn(Optional.of(activeCategory));
            when(serviceCategoryRepository.save(any(ServiceCategory.class))).thenAnswer(invocation -> {
                ServiceCategory category = invocation.getArgument(0);
                assertThat(category.isActive()).isFalse();
                return category;
            });

            // When
            commandService.deactivateServiceCategory(categoryId);

            // Then
            verify(serviceCategoryRepository).save(any(ServiceCategory.class));
        }

        @Test
        @DisplayName("should throw exception when category not found")
        void deactivateServiceCategory_CategoryNotFound_ThrowsException() {
            // Given
            Long categoryId = 99999L;

            when(serviceCategoryRepository.findById(categoryId)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> commandService.deactivateServiceCategory(categoryId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("ServiceCategory");
        }

        @Test
        @DisplayName("should throw exception when category already inactive")
        void deactivateServiceCategory_AlreadyInactive_ThrowsException() {
            // Given
            Long categoryId = 1L;
            ServiceCategory inactiveCategory = createServiceCategory(categoryId, "Inactive Category", false);

            when(serviceCategoryRepository.findById(categoryId)).thenReturn(Optional.of(inactiveCategory));

            // When & Then
            assertThatThrownBy(() -> commandService.deactivateServiceCategory(categoryId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("ServiceCategory");
        }
    }

    // ==========================================================================
    // Create Vendor Offering Tests
    // ==========================================================================

    @Nested
    @DisplayName("Create Vendor Offering")
    class CreateVendorOfferingTests {

        @Test
        @DisplayName("should create vendor offering with VENDOR role")
        void createVendorOffering_VendorRole_ReturnsId() {
            // Given
            Company vendor = createCompanyWithRole(1L, "Vendor Company", RoleType.VENDOR);
            ServiceCategory category = createServiceCategory(1L, "CNC Machining", true);

            CreateVendorOfferingCommand command = new CreateVendorOfferingCommand(
                    1L, // vendorId
                    1L, // serviceCategoryId
                    "VND-001",
                    "CNC Service",
                    new BigDecimal("50000"),
                    "KRW",
                    5,
                    10,
                    LocalDate.now(),
                    null,
                    true,
                    "Premium vendor"
            );

            VendorServiceOffering savedOffering = createVendorOffering(1L, vendor, category);

            when(companyRepository.findById(1L)).thenReturn(Optional.of(vendor));
            when(serviceCategoryRepository.findById(1L)).thenReturn(Optional.of(category));
            when(vendorOfferingRepository.existsByVendorAndServiceAndEffectiveFrom(anyLong(), anyLong(), any())).thenReturn(false);
            when(vendorOfferingRepository.save(any(VendorServiceOffering.class))).thenReturn(savedOffering);

            // When
            Long result = commandService.createVendorOffering(command);

            // Then
            assertThat(result).isEqualTo(1L);
            verify(vendorOfferingRepository).save(any(VendorServiceOffering.class));
        }

        @Test
        @DisplayName("should create vendor offering with OUTSOURCE role")
        void createVendorOffering_OutsourceRole_ReturnsId() {
            // Given
            Company vendor = createCompanyWithRole(2L, "Outsource Company", RoleType.OUTSOURCE);
            ServiceCategory category = createServiceCategory(1L, "Painting", true);

            CreateVendorOfferingCommand command = new CreateVendorOfferingCommand(
                    2L, 1L, null, null, new BigDecimal("30000"), "KRW",
                    3, null, null, null, false, null
            );

            VendorServiceOffering savedOffering = createVendorOffering(2L, vendor, category);

            when(companyRepository.findById(2L)).thenReturn(Optional.of(vendor));
            when(serviceCategoryRepository.findById(1L)).thenReturn(Optional.of(category));
            when(vendorOfferingRepository.save(any(VendorServiceOffering.class))).thenReturn(savedOffering);

            // When
            Long result = commandService.createVendorOffering(command);

            // Then
            assertThat(result).isEqualTo(2L);
        }

        @Test
        @DisplayName("should throw exception when vendor not found")
        void createVendorOffering_VendorNotFound_ThrowsException() {
            // Given
            CreateVendorOfferingCommand command = new CreateVendorOfferingCommand(
                    99999L, 1L, null, null, null, null, null, null, null, null, false, null
            );

            when(companyRepository.findById(99999L)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> commandService.createVendorOffering(command))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Company");
        }

        @Test
        @DisplayName("should throw exception when company has no VENDOR/OUTSOURCE role")
        void createVendorOffering_NoVendorRole_ThrowsException() {
            // Given
            Company customer = createCompanyWithRole(1L, "Customer Company", RoleType.CUSTOMER);

            CreateVendorOfferingCommand command = new CreateVendorOfferingCommand(
                    1L, 1L, null, null, null, null, null, null, null, null, false, null
            );

            when(companyRepository.findById(1L)).thenReturn(Optional.of(customer));

            // When & Then
            assertThatThrownBy(() -> commandService.createVendorOffering(command))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("VENDOR or OUTSOURCE role");
        }

        @Test
        @DisplayName("should throw exception when service category not found")
        void createVendorOffering_ServiceCategoryNotFound_ThrowsException() {
            // Given
            Company vendor = createCompanyWithRole(1L, "Vendor", RoleType.VENDOR);

            CreateVendorOfferingCommand command = new CreateVendorOfferingCommand(
                    1L, 99999L, null, null, null, null, null, null, null, null, false, null
            );

            when(companyRepository.findById(1L)).thenReturn(Optional.of(vendor));
            when(serviceCategoryRepository.findById(99999L)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> commandService.createVendorOffering(command))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("ServiceCategory");
        }

        @Test
        @DisplayName("should throw exception when duplicate offering exists")
        void createVendorOffering_DuplicateOffering_ThrowsException() {
            // Given
            Company vendor = createCompanyWithRole(1L, "Vendor", RoleType.VENDOR);
            ServiceCategory category = createServiceCategory(1L, "Category", true);
            LocalDate effectiveDate = LocalDate.now();

            CreateVendorOfferingCommand command = new CreateVendorOfferingCommand(
                    1L, 1L, null, null, null, null, null, null,
                    effectiveDate, null, false, null
            );

            when(companyRepository.findById(1L)).thenReturn(Optional.of(vendor));
            when(serviceCategoryRepository.findById(1L)).thenReturn(Optional.of(category));
            when(vendorOfferingRepository.existsByVendorAndServiceAndEffectiveFrom(1L, 1L, effectiveDate))
                    .thenReturn(true);

            // When & Then
            assertThatThrownBy(() -> commandService.createVendorOffering(command))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("already exists");
        }

        @Test
        @DisplayName("should throw exception when effectiveTo is before effectiveFrom")
        void createVendorOffering_InvalidDateRange_ThrowsException() {
            // Given
            Company vendor = createCompanyWithRole(1L, "Vendor", RoleType.VENDOR);
            ServiceCategory category = createServiceCategory(1L, "Category", true);

            CreateVendorOfferingCommand command = new CreateVendorOfferingCommand(
                    1L, 1L, null, null, null, null, null, null,
                    LocalDate.of(2025, 12, 31), // effectiveFrom
                    LocalDate.of(2025, 1, 1),   // effectiveTo before effectiveFrom
                    false, null
            );

            when(companyRepository.findById(1L)).thenReturn(Optional.of(vendor));
            when(serviceCategoryRepository.findById(1L)).thenReturn(Optional.of(category));
            when(vendorOfferingRepository.existsByVendorAndServiceAndEffectiveFrom(anyLong(), anyLong(), any()))
                    .thenReturn(false);

            // When & Then
            assertThatThrownBy(() -> commandService.createVendorOffering(command))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("end date must be on or after start date");
        }
    }

    // ==========================================================================
    // Update Vendor Offering Tests
    // ==========================================================================

    @Nested
    @DisplayName("Update Vendor Offering")
    class UpdateVendorOfferingTests {

        @Test
        @DisplayName("should update vendor offering fields")
        void updateVendorOffering_ValidData_ReturnsId() {
            // Given
            Long offeringId = 1L;
            Company vendor = createCompanyWithRole(1L, "Vendor", RoleType.VENDOR);
            ServiceCategory category = createServiceCategory(1L, "Category", true);
            VendorServiceOffering existing = createVendorOffering(offeringId, vendor, category);

            UpdateVendorOfferingCommand command = new UpdateVendorOfferingCommand(
                    "NEW-CODE",
                    "New Service Name",
                    new BigDecimal("75000"),
                    "USD",
                    7,
                    20,
                    null, null,
                    true,
                    "Updated notes"
            );

            when(vendorOfferingRepository.findById(offeringId)).thenReturn(Optional.of(existing));
            when(vendorOfferingRepository.save(any(VendorServiceOffering.class))).thenReturn(existing);

            // When
            Long result = commandService.updateVendorOffering(offeringId, command);

            // Then
            assertThat(result).isEqualTo(offeringId);
            verify(vendorOfferingRepository).save(any(VendorServiceOffering.class));
        }

        @Test
        @DisplayName("should throw exception when offering not found")
        void updateVendorOffering_OfferingNotFound_ThrowsException() {
            // Given
            Long offeringId = 99999L;
            UpdateVendorOfferingCommand command = new UpdateVendorOfferingCommand(
                    null, "Name", null, null, null, null, null, null, null, null
            );

            when(vendorOfferingRepository.findById(offeringId)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> commandService.updateVendorOffering(offeringId, command))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("VendorServiceOffering");
        }

        @Test
        @DisplayName("should throw exception when updating to invalid date range")
        void updateVendorOffering_InvalidDateRange_ThrowsException() {
            // Given
            Long offeringId = 1L;
            Company vendor = createCompanyWithRole(1L, "Vendor", RoleType.VENDOR);
            ServiceCategory category = createServiceCategory(1L, "Category", true);
            VendorServiceOffering existing = createVendorOffering(offeringId, vendor, category);

            UpdateVendorOfferingCommand command = new UpdateVendorOfferingCommand(
                    null, null, null, null, null, null,
                    LocalDate.of(2025, 12, 31),
                    LocalDate.of(2025, 1, 1), // Before effectiveFrom
                    null, null
            );

            when(vendorOfferingRepository.findById(offeringId)).thenReturn(Optional.of(existing));

            // When & Then
            assertThatThrownBy(() -> commandService.updateVendorOffering(offeringId, command))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("end date must be on or after start date");
        }
    }

    // ==========================================================================
    // Delete Vendor Offering Tests
    // ==========================================================================

    @Nested
    @DisplayName("Delete Vendor Offering")
    class DeleteVendorOfferingTests {

        @Test
        @DisplayName("should delete vendor offering")
        void deleteVendorOffering_ValidId_DeletesOffering() {
            // Given
            Long offeringId = 1L;
            Company vendor = createCompanyWithRole(1L, "Vendor", RoleType.VENDOR);
            ServiceCategory category = createServiceCategory(1L, "Category", true);
            VendorServiceOffering offering = createVendorOffering(offeringId, vendor, category);

            when(vendorOfferingRepository.findById(offeringId)).thenReturn(Optional.of(offering));

            // When
            commandService.deleteVendorOffering(offeringId);

            // Then
            verify(vendorOfferingRepository).delete(offering);
        }

        @Test
        @DisplayName("should throw exception when offering not found")
        void deleteVendorOffering_OfferingNotFound_ThrowsException() {
            // Given
            Long offeringId = 99999L;

            when(vendorOfferingRepository.findById(offeringId)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> commandService.deleteVendorOffering(offeringId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("VendorServiceOffering");
        }
    }

    // ==========================================================================
    // Helper Methods
    // ==========================================================================

    private ServiceCategory createServiceCategory(Long id, String name, boolean active) {
        ServiceCategory category = new ServiceCategory();
        category.setId(id);
        category.setName(name);
        category.setActive(active);
        return category;
    }

    private Company createCompanyWithRole(Long id, String name, RoleType roleType) {
        Company company = Company.builder()
                .id(id)
                .name(name)
                .isActive(true)
                .build();

        CompanyRole role = CompanyRole.builder()
                .id(id)
                .company(company)
                .roleType(roleType)
                .build();

        Set<CompanyRole> roles = new HashSet<>();
        roles.add(role);
        company.setRoles(roles);

        return company;
    }

    private VendorServiceOffering createVendorOffering(Long id, Company vendor, ServiceCategory category) {
        VendorServiceOffering offering = new VendorServiceOffering();
        offering.setId(id);
        offering.setVendor(vendor);
        offering.setServiceCategory(category);
        return offering;
    }
}
