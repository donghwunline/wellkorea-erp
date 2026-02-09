package com.wellkorea.backend.core.catalog.application;

import com.wellkorea.backend.core.catalog.domain.Material;
import com.wellkorea.backend.core.catalog.domain.MaterialCategory;
import com.wellkorea.backend.core.catalog.domain.VendorMaterialOffering;
import com.wellkorea.backend.core.catalog.infrastructure.persistence.MaterialCategoryRepository;
import com.wellkorea.backend.core.catalog.infrastructure.persistence.MaterialRepository;
import com.wellkorea.backend.core.catalog.infrastructure.persistence.VendorMaterialOfferingRepository;
import com.wellkorea.backend.core.company.domain.Company;
import com.wellkorea.backend.core.company.domain.vo.CompanyRole;
import com.wellkorea.backend.core.company.domain.vo.RoleType;
import com.wellkorea.backend.core.company.infrastructure.persistence.CompanyRepository;
import com.wellkorea.backend.shared.exception.BusinessException;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

/**
 * Unit tests for MaterialCommandService.
 * Tests validate material and vendor material offering business logic for write operations.
 */
@Tag("unit")
@ExtendWith(MockitoExtension.class)
@DisplayName("Material Command Service Unit Tests")
class MaterialCommandServiceTest {

    @Mock
    private MaterialRepository materialRepository;

    @Mock
    private MaterialCategoryRepository categoryRepository;

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private VendorMaterialOfferingRepository vendorMaterialOfferingRepository;

    @InjectMocks
    private MaterialCommandService commandService;

    // ==========================================================================
    // Create Material Tests
    // ==========================================================================

    @Nested
    @DisplayName("Create Material")
    class CreateMaterialTests {

        @Test
        @DisplayName("should create material with all fields and return ID")
        void createMaterial_ValidData_ReturnsId() {
            // Given
            CreateMaterialCommand command = new CreateMaterialCommand(
                    "MAT-001",
                    "Stainless Steel Bolt M10",
                    "High-grade stainless steel bolt",
                    1L,
                    "EA",
                    new BigDecimal("500"),
                    2L
            );

            MaterialCategory category = createMaterialCategory(1L, "Fasteners", true);
            Company vendor = createCompanyWithRole(2L, "Vendor Co", RoleType.VENDOR);
            Material savedMaterial = createMaterial(1L, "MAT-001", "Stainless Steel Bolt M10", category);

            when(materialRepository.existsBySku("MAT-001")).thenReturn(false);
            when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
            when(companyRepository.findById(2L)).thenReturn(Optional.of(vendor));
            when(materialRepository.save(any(Material.class))).thenReturn(savedMaterial);

            // When
            Long result = commandService.createMaterial(command);

            // Then
            assertThat(result).isEqualTo(1L);
            verify(materialRepository).save(any(Material.class));
        }

        @Test
        @DisplayName("should create material with minimal fields (no vendor)")
        void createMaterial_MinimalFields_ReturnsId() {
            // Given
            CreateMaterialCommand command = new CreateMaterialCommand(
                    "MAT-002",
                    "Copper Wire",
                    null,
                    1L,
                    "M",
                    null,
                    null
            );

            MaterialCategory category = createMaterialCategory(1L, "Raw Materials", true);
            Material savedMaterial = createMaterial(2L, "MAT-002", "Copper Wire", category);

            when(materialRepository.existsBySku("MAT-002")).thenReturn(false);
            when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
            when(materialRepository.save(any(Material.class))).thenReturn(savedMaterial);

            // When
            Long result = commandService.createMaterial(command);

            // Then
            assertThat(result).isEqualTo(2L);
            verify(companyRepository, never()).findById(anyLong());
        }

        @Test
        @DisplayName("should throw exception when SKU is duplicate")
        void createMaterial_DuplicateSku_ThrowsException() {
            // Given
            CreateMaterialCommand command = new CreateMaterialCommand(
                    "EXISTING-SKU",
                    "Some Material",
                    null,
                    1L,
                    "EA",
                    null,
                    null
            );

            when(materialRepository.existsBySku("EXISTING-SKU")).thenReturn(true);

            // When & Then
            assertThatThrownBy(() -> commandService.createMaterial(command))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("EXISTING-SKU")
                    .hasMessageContaining("already exists");
        }

        @Test
        @DisplayName("should throw exception when category not found")
        void createMaterial_CategoryNotFound_ThrowsException() {
            // Given
            CreateMaterialCommand command = new CreateMaterialCommand(
                    "MAT-003",
                    "Material",
                    null,
                    99999L,
                    "EA",
                    null,
                    null
            );

            when(materialRepository.existsBySku("MAT-003")).thenReturn(false);
            when(categoryRepository.findById(99999L)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> commandService.createMaterial(command))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Material category")
                    .hasMessageContaining("99999");
        }

        @Test
        @DisplayName("should throw exception when category is inactive")
        void createMaterial_InactiveCategory_ThrowsException() {
            // Given
            CreateMaterialCommand command = new CreateMaterialCommand(
                    "MAT-004",
                    "Material",
                    null,
                    1L,
                    "EA",
                    null,
                    null
            );

            MaterialCategory inactiveCategory = createMaterialCategory(1L, "Inactive Category", false);

            when(materialRepository.existsBySku("MAT-004")).thenReturn(false);
            when(categoryRepository.findById(1L)).thenReturn(Optional.of(inactiveCategory));

            // When & Then
            assertThatThrownBy(() -> commandService.createMaterial(command))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("not active");
        }

        @Test
        @DisplayName("should throw exception when preferred vendor not found")
        void createMaterial_VendorNotFound_ThrowsException() {
            // Given
            CreateMaterialCommand command = new CreateMaterialCommand(
                    "MAT-005",
                    "Material",
                    null,
                    1L,
                    "EA",
                    null,
                    99999L
            );

            MaterialCategory category = createMaterialCategory(1L, "Category", true);

            when(materialRepository.existsBySku("MAT-005")).thenReturn(false);
            when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
            when(companyRepository.findById(99999L)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> commandService.createMaterial(command))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Company")
                    .hasMessageContaining("99999");
        }
    }

    // ==========================================================================
    // Update Material Tests
    // ==========================================================================

    @Nested
    @DisplayName("Update Material")
    class UpdateMaterialTests {

        @Test
        @DisplayName("should update all material fields")
        void updateMaterial_AllFields_ReturnsId() {
            // Given
            Long materialId = 1L;
            MaterialCategory oldCategory = createMaterialCategory(1L, "Old Category", true);
            Material existingMaterial = createMaterial(materialId, "MAT-001", "Old Name", oldCategory);

            MaterialCategory newCategory = createMaterialCategory(2L, "New Category", true);
            Company newVendor = createCompanyWithRole(3L, "New Vendor", RoleType.VENDOR);

            UpdateMaterialCommand command = new UpdateMaterialCommand(
                    "New Name",
                    "New Description",
                    2L,
                    "KG",
                    new BigDecimal("1000"),
                    3L,
                    false
            );

            when(materialRepository.findById(materialId)).thenReturn(Optional.of(existingMaterial));
            when(categoryRepository.findById(2L)).thenReturn(Optional.of(newCategory));
            when(companyRepository.findById(3L)).thenReturn(Optional.of(newVendor));
            when(materialRepository.save(any(Material.class))).thenReturn(existingMaterial);

            // When
            Long result = commandService.updateMaterial(materialId, command);

            // Then
            assertThat(result).isEqualTo(materialId);
            verify(materialRepository).save(any(Material.class));
        }

        @Test
        @DisplayName("should update only provided fields (partial update)")
        void updateMaterial_PartialUpdate_OnlyUpdatesProvidedFields() {
            // Given
            Long materialId = 1L;
            MaterialCategory category = createMaterialCategory(1L, "Category", true);
            Material existingMaterial = createMaterial(materialId, "MAT-001", "Original Name", category);
            existingMaterial.setDescription("Original Description");
            existingMaterial.setUnit("EA");

            UpdateMaterialCommand command = new UpdateMaterialCommand(
                    null,  // Keep existing name
                    "Updated Description",
                    null,  // Keep existing category
                    null,  // Keep existing unit
                    null,  // Keep existing price
                    null,  // Keep existing vendor
                    null   // Keep existing active status
            );

            when(materialRepository.findById(materialId)).thenReturn(Optional.of(existingMaterial));
            when(materialRepository.save(any(Material.class))).thenAnswer(invocation -> {
                Material material = invocation.getArgument(0);
                assertThat(material.getName()).isEqualTo("Original Name");
                assertThat(material.getDescription()).isEqualTo("Updated Description");
                assertThat(material.getUnit()).isEqualTo("EA");
                return material;
            });

            // When
            Long result = commandService.updateMaterial(materialId, command);

            // Then
            assertThat(result).isEqualTo(materialId);
            verify(categoryRepository, never()).findById(anyLong());
            verify(companyRepository, never()).findById(anyLong());
        }

        @Test
        @DisplayName("should throw exception when material not found")
        void updateMaterial_MaterialNotFound_ThrowsException() {
            // Given
            Long materialId = 99999L;
            UpdateMaterialCommand command = new UpdateMaterialCommand(
                    "New Name", null, null, null, null, null, null
            );

            when(materialRepository.findById(materialId)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> commandService.updateMaterial(materialId, command))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Material")
                    .hasMessageContaining("99999");
        }

        @Test
        @DisplayName("should throw exception when new category not found")
        void updateMaterial_NewCategoryNotFound_ThrowsException() {
            // Given
            Long materialId = 1L;
            MaterialCategory category = createMaterialCategory(1L, "Category", true);
            Material existingMaterial = createMaterial(materialId, "MAT-001", "Name", category);

            UpdateMaterialCommand command = new UpdateMaterialCommand(
                    null, null, 99999L, null, null, null, null
            );

            when(materialRepository.findById(materialId)).thenReturn(Optional.of(existingMaterial));
            when(categoryRepository.findById(99999L)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> commandService.updateMaterial(materialId, command))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Material category")
                    .hasMessageContaining("99999");
        }

        @Test
        @DisplayName("should throw exception when new vendor not found")
        void updateMaterial_NewVendorNotFound_ThrowsException() {
            // Given
            Long materialId = 1L;
            MaterialCategory category = createMaterialCategory(1L, "Category", true);
            Material existingMaterial = createMaterial(materialId, "MAT-001", "Name", category);

            UpdateMaterialCommand command = new UpdateMaterialCommand(
                    null, null, null, null, null, 99999L, null
            );

            when(materialRepository.findById(materialId)).thenReturn(Optional.of(existingMaterial));
            when(companyRepository.findById(99999L)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> commandService.updateMaterial(materialId, command))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Company")
                    .hasMessageContaining("99999");
        }

        @Test
        @DisplayName("should update active flag")
        void updateMaterial_ActiveFlag_UpdatesFlag() {
            // Given
            Long materialId = 1L;
            MaterialCategory category = createMaterialCategory(1L, "Category", true);
            Material existingMaterial = createMaterial(materialId, "MAT-001", "Name", category);
            existingMaterial.setActive(true);

            UpdateMaterialCommand command = new UpdateMaterialCommand(
                    null, null, null, null, null, null, false
            );

            when(materialRepository.findById(materialId)).thenReturn(Optional.of(existingMaterial));
            when(materialRepository.save(any(Material.class))).thenAnswer(invocation -> {
                Material material = invocation.getArgument(0);
                assertThat(material.isActive()).isFalse();
                return material;
            });

            // When
            Long result = commandService.updateMaterial(materialId, command);

            // Then
            assertThat(result).isEqualTo(materialId);
        }
    }

    // ==========================================================================
    // Deactivate Material Tests
    // ==========================================================================

    @Nested
    @DisplayName("Deactivate Material")
    class DeactivateMaterialTests {

        @Test
        @DisplayName("should deactivate active material")
        void deactivateMaterial_ActiveMaterial_SetsInactive() {
            // Given
            Long materialId = 1L;
            MaterialCategory category = createMaterialCategory(1L, "Category", true);
            Material activeMaterial = createMaterial(materialId, "MAT-001", "Name", category);
            activeMaterial.setActive(true);

            when(materialRepository.findById(materialId)).thenReturn(Optional.of(activeMaterial));
            when(materialRepository.save(any(Material.class))).thenAnswer(invocation -> {
                Material material = invocation.getArgument(0);
                assertThat(material.isActive()).isFalse();
                return material;
            });

            // When
            commandService.deactivateMaterial(materialId);

            // Then
            verify(materialRepository).save(any(Material.class));
        }

        @Test
        @DisplayName("should throw exception when material not found")
        void deactivateMaterial_MaterialNotFound_ThrowsException() {
            // Given
            Long materialId = 99999L;

            when(materialRepository.findById(materialId)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> commandService.deactivateMaterial(materialId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Material")
                    .hasMessageContaining("99999");
        }
    }

    // ==========================================================================
    // Create Vendor Material Offering Tests
    // ==========================================================================

    @Nested
    @DisplayName("Create Vendor Material Offering")
    class CreateVendorMaterialOfferingTests {

        @Test
        @DisplayName("should create vendor material offering with all fields")
        void createVendorMaterialOffering_ValidData_ReturnsId() {
            // Given
            Company vendor = createCompanyWithRole(1L, "Vendor Co", RoleType.VENDOR);
            MaterialCategory category = createMaterialCategory(1L, "Category", true);
            Material material = createMaterial(2L, "MAT-001", "Material", category);

            LocalDate effectiveFrom = LocalDate.now();
            LocalDate effectiveTo = LocalDate.now().plusYears(1);

            CreateVendorMaterialOfferingCommand command = new CreateVendorMaterialOfferingCommand(
                    1L, // vendorId
                    2L, // materialId
                    "VND-001",
                    "Vendor Material Name",
                    new BigDecimal("50000"),
                    "KRW",
                    5,
                    10,
                    effectiveFrom,
                    effectiveTo,
                    false,
                    "Test notes"
            );

            VendorMaterialOffering savedOffering = createVendorMaterialOffering(1L, vendor, material);

            when(companyRepository.findById(1L)).thenReturn(Optional.of(vendor));
            when(materialRepository.findById(2L)).thenReturn(Optional.of(material));
            when(vendorMaterialOfferingRepository.existsByVendorAndMaterialAndEffectiveFrom(1L, 2L, effectiveFrom))
                    .thenReturn(false);
            when(vendorMaterialOfferingRepository.save(any(VendorMaterialOffering.class))).thenReturn(savedOffering);

            // When
            Long result = commandService.createVendorMaterialOffering(command);

            // Then
            assertThat(result).isEqualTo(1L);
            verify(vendorMaterialOfferingRepository).save(any(VendorMaterialOffering.class));
        }

        @Test
        @DisplayName("should set offering as preferred and clear others")
        void createVendorMaterialOffering_SetPreferred_ClearsOthers() {
            // Given
            Company vendor = createCompanyWithRole(1L, "Vendor", RoleType.VENDOR);
            MaterialCategory category = createMaterialCategory(1L, "Category", true);
            Material material = createMaterial(2L, "MAT-001", "Material", category);

            LocalDate effectiveFrom = LocalDate.now();
            LocalDate effectiveTo = LocalDate.now().plusYears(1);

            CreateVendorMaterialOfferingCommand command = new CreateVendorMaterialOfferingCommand(
                    1L, 2L, null, null, null, null, null, null,
                    effectiveFrom, effectiveTo, true, null  // isPreferred = true
            );

            VendorMaterialOffering savedOffering = createVendorMaterialOffering(1L, vendor, material);

            when(companyRepository.findById(1L)).thenReturn(Optional.of(vendor));
            when(materialRepository.findById(2L)).thenReturn(Optional.of(material));
            when(vendorMaterialOfferingRepository.existsByVendorAndMaterialAndEffectiveFrom(anyLong(), anyLong(), any()))
                    .thenReturn(false);
            when(vendorMaterialOfferingRepository.save(any(VendorMaterialOffering.class))).thenReturn(savedOffering);

            // When
            commandService.createVendorMaterialOffering(command);

            // Then
            verify(vendorMaterialOfferingRepository).clearPreferredForMaterial(2L);
        }

        @Test
        @DisplayName("should throw exception when vendor not found")
        void createVendorMaterialOffering_VendorNotFound_ThrowsException() {
            // Given
            CreateVendorMaterialOfferingCommand command = new CreateVendorMaterialOfferingCommand(
                    99999L, 1L, null, null, null, null, null, null,
                    LocalDate.now(), LocalDate.now().plusMonths(1), false, null
            );

            when(companyRepository.findById(99999L)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> commandService.createVendorMaterialOffering(command))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Company");
        }

        @Test
        @DisplayName("should throw exception when company lacks VENDOR role")
        void createVendorMaterialOffering_NoVendorRole_ThrowsException() {
            // Given
            Company customer = createCompanyWithRole(1L, "Customer Co", RoleType.CUSTOMER);

            CreateVendorMaterialOfferingCommand command = new CreateVendorMaterialOfferingCommand(
                    1L, 1L, null, null, null, null, null, null,
                    LocalDate.now(), LocalDate.now().plusMonths(1), false, null
            );

            when(companyRepository.findById(1L)).thenReturn(Optional.of(customer));

            // When & Then
            assertThatThrownBy(() -> commandService.createVendorMaterialOffering(command))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("VENDOR role");
        }

        @Test
        @DisplayName("should throw exception when material not found")
        void createVendorMaterialOffering_MaterialNotFound_ThrowsException() {
            // Given
            Company vendor = createCompanyWithRole(1L, "Vendor", RoleType.VENDOR);

            CreateVendorMaterialOfferingCommand command = new CreateVendorMaterialOfferingCommand(
                    1L, 99999L, null, null, null, null, null, null,
                    LocalDate.now(), LocalDate.now().plusMonths(1), false, null
            );

            when(companyRepository.findById(1L)).thenReturn(Optional.of(vendor));
            when(materialRepository.findById(99999L)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> commandService.createVendorMaterialOffering(command))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Material");
        }

        @Test
        @DisplayName("should throw exception when duplicate offering exists")
        void createVendorMaterialOffering_DuplicateOffering_ThrowsException() {
            // Given
            Company vendor = createCompanyWithRole(1L, "Vendor", RoleType.VENDOR);
            MaterialCategory category = createMaterialCategory(1L, "Category", true);
            Material material = createMaterial(2L, "MAT-001", "Material", category);
            LocalDate effectiveDate = LocalDate.now();

            CreateVendorMaterialOfferingCommand command = new CreateVendorMaterialOfferingCommand(
                    1L, 2L, null, null, null, null, null, null,
                    effectiveDate, effectiveDate.plusMonths(1), false, null
            );

            when(companyRepository.findById(1L)).thenReturn(Optional.of(vendor));
            when(materialRepository.findById(2L)).thenReturn(Optional.of(material));
            when(vendorMaterialOfferingRepository.existsByVendorAndMaterialAndEffectiveFrom(1L, 2L, effectiveDate))
                    .thenReturn(true);

            // When & Then
            assertThatThrownBy(() -> commandService.createVendorMaterialOffering(command))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("already exists");
        }

        @Test
        @DisplayName("should throw exception when effectiveTo is before effectiveFrom")
        void createVendorMaterialOffering_InvalidDateRange_ThrowsException() {
            // Given
            Company vendor = createCompanyWithRole(1L, "Vendor", RoleType.VENDOR);
            MaterialCategory category = createMaterialCategory(1L, "Category", true);
            Material material = createMaterial(2L, "MAT-001", "Material", category);

            CreateVendorMaterialOfferingCommand command = new CreateVendorMaterialOfferingCommand(
                    1L, 2L, null, null, null, null, null, null,
                    LocalDate.of(2025, 12, 31),  // effectiveFrom
                    LocalDate.of(2025, 1, 1),    // effectiveTo (before effectiveFrom)
                    false, null
            );

            when(companyRepository.findById(1L)).thenReturn(Optional.of(vendor));
            when(materialRepository.findById(2L)).thenReturn(Optional.of(material));
            when(vendorMaterialOfferingRepository.existsByVendorAndMaterialAndEffectiveFrom(anyLong(), anyLong(), any()))
                    .thenReturn(false);

            // When & Then
            assertThatThrownBy(() -> commandService.createVendorMaterialOffering(command))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("end date must be on or after start date");
        }
    }

    // ==========================================================================
    // Update Vendor Material Offering Tests
    // ==========================================================================

    @Nested
    @DisplayName("Update Vendor Material Offering")
    class UpdateVendorMaterialOfferingTests {

        @Test
        @DisplayName("should update vendor offering fields")
        void updateVendorMaterialOffering_ValidData_ReturnsId() {
            // Given
            Long offeringId = 1L;
            Company vendor = createCompanyWithRole(1L, "Vendor", RoleType.VENDOR);
            MaterialCategory category = createMaterialCategory(1L, "Category", true);
            Material material = createMaterial(2L, "MAT-001", "Material", category);
            VendorMaterialOffering existing = createVendorMaterialOffering(offeringId, vendor, material);
            existing.setEffectiveFrom(LocalDate.now());

            UpdateVendorMaterialOfferingCommand command = new UpdateVendorMaterialOfferingCommand(
                    "NEW-CODE",
                    "New Material Name",
                    new BigDecimal("75000"),
                    "USD",
                    7,
                    20,
                    null,  // Keep existing effectiveFrom
                    LocalDate.now().plusYears(2),
                    true,
                    "Updated notes"
            );

            when(vendorMaterialOfferingRepository.findById(offeringId)).thenReturn(Optional.of(existing));
            when(vendorMaterialOfferingRepository.save(any(VendorMaterialOffering.class))).thenReturn(existing);

            // When
            Long result = commandService.updateVendorMaterialOffering(offeringId, command);

            // Then
            assertThat(result).isEqualTo(offeringId);
            verify(vendorMaterialOfferingRepository).save(any(VendorMaterialOffering.class));
        }

        @Test
        @DisplayName("should set as preferred and clear other offerings")
        void updateVendorMaterialOffering_SetPreferred_ClearsOthers() {
            // Given
            Long offeringId = 1L;
            Company vendor = createCompanyWithRole(1L, "Vendor", RoleType.VENDOR);
            MaterialCategory category = createMaterialCategory(1L, "Category", true);
            Material material = createMaterial(2L, "MAT-001", "Material", category);
            VendorMaterialOffering existing = createVendorMaterialOffering(offeringId, vendor, material);
            existing.setPreferred(false);

            UpdateVendorMaterialOfferingCommand command = new UpdateVendorMaterialOfferingCommand(
                    null, null, null, null, null, null, null, null,
                    true,  // Set as preferred
                    null
            );

            when(vendorMaterialOfferingRepository.findById(offeringId)).thenReturn(Optional.of(existing));
            when(vendorMaterialOfferingRepository.save(any(VendorMaterialOffering.class))).thenReturn(existing);

            // When
            commandService.updateVendorMaterialOffering(offeringId, command);

            // Then
            verify(vendorMaterialOfferingRepository).clearPreferredForMaterial(2L);
        }

        @Test
        @DisplayName("should throw exception when offering not found")
        void updateVendorMaterialOffering_OfferingNotFound_ThrowsException() {
            // Given
            Long offeringId = 99999L;
            UpdateVendorMaterialOfferingCommand command = new UpdateVendorMaterialOfferingCommand(
                    null, "Name", null, null, null, null, null, null, null, null
            );

            when(vendorMaterialOfferingRepository.findById(offeringId)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> commandService.updateVendorMaterialOffering(offeringId, command))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("VendorMaterialOffering");
        }

        @Test
        @DisplayName("should throw exception when updating to invalid date range")
        void updateVendorMaterialOffering_InvalidDateRange_ThrowsException() {
            // Given
            Long offeringId = 1L;
            Company vendor = createCompanyWithRole(1L, "Vendor", RoleType.VENDOR);
            MaterialCategory category = createMaterialCategory(1L, "Category", true);
            Material material = createMaterial(2L, "MAT-001", "Material", category);
            VendorMaterialOffering existing = createVendorMaterialOffering(offeringId, vendor, material);

            UpdateVendorMaterialOfferingCommand command = new UpdateVendorMaterialOfferingCommand(
                    null, null, null, null, null, null,
                    LocalDate.of(2025, 12, 31),  // effectiveFrom
                    LocalDate.of(2025, 1, 1),    // effectiveTo (before effectiveFrom)
                    null, null
            );

            when(vendorMaterialOfferingRepository.findById(offeringId)).thenReturn(Optional.of(existing));

            // When & Then
            assertThatThrownBy(() -> commandService.updateVendorMaterialOffering(offeringId, command))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("end date must be on or after start date");
        }

        @Test
        @DisplayName("should throw exception when duplicate exists on date change")
        void updateVendorMaterialOffering_DuplicateOnDateChange_ThrowsException() {
            // Given
            Long offeringId = 1L;
            Company vendor = createCompanyWithRole(1L, "Vendor", RoleType.VENDOR);
            MaterialCategory category = createMaterialCategory(1L, "Category", true);
            Material material = createMaterial(2L, "MAT-001", "Material", category);
            VendorMaterialOffering existing = createVendorMaterialOffering(offeringId, vendor, material);
            existing.setEffectiveFrom(LocalDate.of(2025, 1, 1));

            LocalDate newEffectiveFrom = LocalDate.of(2025, 6, 1);

            UpdateVendorMaterialOfferingCommand command = new UpdateVendorMaterialOfferingCommand(
                    null, null, null, null, null, null,
                    newEffectiveFrom,  // Changing effective date
                    null, null, null
            );

            when(vendorMaterialOfferingRepository.findById(offeringId)).thenReturn(Optional.of(existing));
            when(vendorMaterialOfferingRepository.existsByVendorAndMaterialAndEffectiveFromAndIdNot(
                    1L, 2L, newEffectiveFrom, offeringId)).thenReturn(true);

            // When & Then
            assertThatThrownBy(() -> commandService.updateVendorMaterialOffering(offeringId, command))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("already exists");
        }

        @Test
        @DisplayName("should allow partial update with null fields")
        void updateVendorMaterialOffering_PartialUpdate_OnlyUpdatesProvidedFields() {
            // Given
            Long offeringId = 1L;
            Company vendor = createCompanyWithRole(1L, "Vendor", RoleType.VENDOR);
            MaterialCategory category = createMaterialCategory(1L, "Category", true);
            Material material = createMaterial(2L, "MAT-001", "Material", category);
            VendorMaterialOffering existing = createVendorMaterialOffering(offeringId, vendor, material);
            existing.setVendorMaterialCode("OLD-CODE");
            existing.setUnitPrice(new BigDecimal("1000"));

            UpdateVendorMaterialOfferingCommand command = new UpdateVendorMaterialOfferingCommand(
                    null,  // Keep existing code
                    null,  // Keep existing name
                    new BigDecimal("2000"),  // Update price
                    null, null, null, null, null, null, null
            );

            when(vendorMaterialOfferingRepository.findById(offeringId)).thenReturn(Optional.of(existing));
            when(vendorMaterialOfferingRepository.save(any(VendorMaterialOffering.class))).thenAnswer(invocation -> {
                VendorMaterialOffering offering = invocation.getArgument(0);
                assertThat(offering.getVendorMaterialCode()).isEqualTo("OLD-CODE");
                assertThat(offering.getUnitPrice()).isEqualTo(new BigDecimal("2000"));
                return offering;
            });

            // When
            Long result = commandService.updateVendorMaterialOffering(offeringId, command);

            // Then
            assertThat(result).isEqualTo(offeringId);
        }
    }

    // ==========================================================================
    // Delete Vendor Material Offering Tests
    // ==========================================================================

    @Nested
    @DisplayName("Delete Vendor Material Offering")
    class DeleteVendorMaterialOfferingTests {

        @Test
        @DisplayName("should delete vendor material offering")
        void deleteVendorMaterialOffering_ValidId_DeletesOffering() {
            // Given
            Long offeringId = 1L;
            Company vendor = createCompanyWithRole(1L, "Vendor", RoleType.VENDOR);
            MaterialCategory category = createMaterialCategory(1L, "Category", true);
            Material material = createMaterial(2L, "MAT-001", "Material", category);
            VendorMaterialOffering offering = createVendorMaterialOffering(offeringId, vendor, material);

            when(vendorMaterialOfferingRepository.findById(offeringId)).thenReturn(Optional.of(offering));

            // When
            commandService.deleteVendorMaterialOffering(offeringId);

            // Then
            verify(vendorMaterialOfferingRepository).delete(offering);
        }

        @Test
        @DisplayName("should throw exception when offering not found")
        void deleteVendorMaterialOffering_OfferingNotFound_ThrowsException() {
            // Given
            Long offeringId = 99999L;

            when(vendorMaterialOfferingRepository.findById(offeringId)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> commandService.deleteVendorMaterialOffering(offeringId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("VendorMaterialOffering");
        }
    }

    // ==========================================================================
    // Set Preferred Vendor Offering Tests
    // ==========================================================================

    @Nested
    @DisplayName("Set Preferred Vendor Offering")
    class SetPreferredVendorOfferingTests {

        @Test
        @DisplayName("should set offering as preferred and clear others")
        void setPreferredVendorOffering_ValidId_SetsPreferred() {
            // Given
            Long offeringId = 1L;
            Company vendor = createCompanyWithRole(1L, "Vendor", RoleType.VENDOR);
            MaterialCategory category = createMaterialCategory(1L, "Category", true);
            Material material = createMaterial(2L, "MAT-001", "Material", category);
            VendorMaterialOffering offering = createVendorMaterialOffering(offeringId, vendor, material);
            offering.setPreferred(false);

            when(vendorMaterialOfferingRepository.findById(offeringId)).thenReturn(Optional.of(offering));
            when(vendorMaterialOfferingRepository.save(any(VendorMaterialOffering.class))).thenAnswer(invocation -> {
                VendorMaterialOffering saved = invocation.getArgument(0);
                assertThat(saved.isPreferred()).isTrue();
                return saved;
            });

            // When
            Long result = commandService.setPreferredVendorOffering(offeringId);

            // Then
            assertThat(result).isEqualTo(offeringId);
            verify(vendorMaterialOfferingRepository).clearPreferredForMaterial(2L);
            verify(vendorMaterialOfferingRepository).save(any(VendorMaterialOffering.class));
        }

        @Test
        @DisplayName("should throw exception when offering not found")
        void setPreferredVendorOffering_OfferingNotFound_ThrowsException() {
            // Given
            Long offeringId = 99999L;

            when(vendorMaterialOfferingRepository.findById(offeringId)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> commandService.setPreferredVendorOffering(offeringId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("VendorMaterialOffering");
        }
    }

    // ==========================================================================
    // Helper Methods
    // ==========================================================================

    private MaterialCategory createMaterialCategory(Long id, String name, boolean active) {
        MaterialCategory category = new MaterialCategory();
        category.setId(id);
        category.setName(name);
        category.setActive(active);
        return category;
    }

    private Material createMaterial(Long id, String sku, String name, MaterialCategory category) {
        Material material = new Material();
        material.setId(id);
        material.setSku(sku);
        material.setName(name);
        material.setCategory(category);
        material.setUnit("EA");
        material.setActive(true);
        return material;
    }

    private Company createCompanyWithRole(Long id, String name, RoleType roleType) {
        Company company = Company.builder()
                .id(id)
                .name(name)
                .isActive(true)
                .build();

        CompanyRole role = CompanyRole.builder()
                .roleType(roleType)
                .build();

        company.addRole(role);

        return company;
    }

    private VendorMaterialOffering createVendorMaterialOffering(Long id, Company vendor, Material material) {
        VendorMaterialOffering offering = new VendorMaterialOffering();
        offering.setId(id);
        offering.setVendor(vendor);
        offering.setMaterial(material);
        return offering;
    }
}
