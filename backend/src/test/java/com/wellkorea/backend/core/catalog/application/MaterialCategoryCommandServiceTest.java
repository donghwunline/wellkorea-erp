package com.wellkorea.backend.core.catalog.application;

import com.wellkorea.backend.core.catalog.domain.MaterialCategory;
import com.wellkorea.backend.core.catalog.infrastructure.persistence.MaterialCategoryRepository;
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

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for MaterialCategoryCommandService.
 * Tests validate material category business logic for write operations.
 */
@Tag("unit")
@ExtendWith(MockitoExtension.class)
@DisplayName("Material Category Command Service Unit Tests")
class MaterialCategoryCommandServiceTest {

    @Mock
    private MaterialCategoryRepository categoryRepository;

    @InjectMocks
    private MaterialCategoryCommandService commandService;

    // ==========================================================================
    // Create Material Category Tests
    // ==========================================================================

    @Nested
    @DisplayName("Create Material Category")
    class CreateMaterialCategoryTests {

        @Test
        @DisplayName("should create material category and return ID")
        void createMaterialCategory_ValidData_ReturnsId() {
            // Given
            CreateMaterialCategoryCommand command = new CreateMaterialCategoryCommand(
                    "Fasteners",
                    "Bolts, nuts, screws and other fasteners"
            );

            MaterialCategory savedCategory = createMaterialCategory(1L, "Fasteners", true);

            when(categoryRepository.existsByName("Fasteners")).thenReturn(false);
            when(categoryRepository.save(any(MaterialCategory.class))).thenReturn(savedCategory);

            // When
            Long result = commandService.createMaterialCategory(command);

            // Then
            assertThat(result).isEqualTo(1L);
            verify(categoryRepository).save(any(MaterialCategory.class));
        }

        @Test
        @DisplayName("should create material category with null description")
        void createMaterialCategory_NullDescription_ReturnsId() {
            // Given
            CreateMaterialCategoryCommand command = new CreateMaterialCategoryCommand(
                    "Raw Materials",
                    null
            );

            MaterialCategory savedCategory = createMaterialCategory(2L, "Raw Materials", true);

            when(categoryRepository.existsByName("Raw Materials")).thenReturn(false);
            when(categoryRepository.save(any(MaterialCategory.class))).thenReturn(savedCategory);

            // When
            Long result = commandService.createMaterialCategory(command);

            // Then
            assertThat(result).isEqualTo(2L);
        }

        @Test
        @DisplayName("should throw exception when name is duplicate")
        void createMaterialCategory_DuplicateName_ThrowsException() {
            // Given
            CreateMaterialCategoryCommand command = new CreateMaterialCategoryCommand(
                    "Existing Category",
                    null
            );

            when(categoryRepository.existsByName("Existing Category")).thenReturn(true);

            // When & Then
            assertThatThrownBy(() -> commandService.createMaterialCategory(command))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Existing Category")
                    .hasMessageContaining("already exists");
        }

        @Test
        @DisplayName("should set material category as active by default")
        void createMaterialCategory_SetsActiveTrue() {
            // Given
            CreateMaterialCategoryCommand command = new CreateMaterialCategoryCommand(
                    "New Category",
                    "Description"
            );

            when(categoryRepository.existsByName("New Category")).thenReturn(false);
            when(categoryRepository.save(any(MaterialCategory.class))).thenAnswer(invocation -> {
                MaterialCategory category = invocation.getArgument(0);
                assertThat(category.isActive()).isTrue();
                category.setId(1L);
                return category;
            });

            // When
            Long result = commandService.createMaterialCategory(command);

            // Then
            assertThat(result).isEqualTo(1L);
        }
    }

    // ==========================================================================
    // Update Material Category Tests
    // ==========================================================================

    @Nested
    @DisplayName("Update Material Category")
    class UpdateMaterialCategoryTests {

        @Test
        @DisplayName("should update all material category fields")
        void updateMaterialCategory_AllFields_ReturnsId() {
            // Given
            Long categoryId = 1L;
            MaterialCategory existingCategory = createMaterialCategory(categoryId, "Old Name", true);

            UpdateMaterialCategoryCommand command = new UpdateMaterialCategoryCommand(
                    "New Name",
                    "New Description",
                    false
            );

            when(categoryRepository.findById(categoryId)).thenReturn(Optional.of(existingCategory));
            when(categoryRepository.existsByNameAndIdNot("New Name", categoryId)).thenReturn(false);
            when(categoryRepository.save(any(MaterialCategory.class))).thenReturn(existingCategory);

            // When
            Long result = commandService.updateMaterialCategory(categoryId, command);

            // Then
            assertThat(result).isEqualTo(categoryId);
            verify(categoryRepository).save(any(MaterialCategory.class));
        }

        @Test
        @DisplayName("should update only provided fields (partial update)")
        void updateMaterialCategory_PartialUpdate_OnlyUpdatesProvidedFields() {
            // Given
            Long categoryId = 1L;
            MaterialCategory existingCategory = createMaterialCategory(categoryId, "Original Name", true);
            existingCategory.setDescription("Original Description");

            UpdateMaterialCategoryCommand command = new UpdateMaterialCategoryCommand(
                    null, // Keep existing name
                    "Updated Description",
                    null  // Keep existing active status
            );

            when(categoryRepository.findById(categoryId)).thenReturn(Optional.of(existingCategory));
            when(categoryRepository.save(any(MaterialCategory.class))).thenAnswer(invocation -> {
                MaterialCategory category = invocation.getArgument(0);
                assertThat(category.getName()).isEqualTo("Original Name"); // Unchanged
                assertThat(category.getDescription()).isEqualTo("Updated Description"); // Updated
                assertThat(category.isActive()).isTrue(); // Unchanged
                return category;
            });

            // When
            Long result = commandService.updateMaterialCategory(categoryId, command);

            // Then
            assertThat(result).isEqualTo(categoryId);
            verify(categoryRepository, never()).existsByNameAndIdNot(anyString(), anyLong());
        }

        @Test
        @DisplayName("should throw exception when updating to duplicate name")
        void updateMaterialCategory_DuplicateName_ThrowsException() {
            // Given
            Long categoryId = 1L;
            MaterialCategory existingCategory = createMaterialCategory(categoryId, "Original Name", true);

            UpdateMaterialCategoryCommand command = new UpdateMaterialCategoryCommand(
                    "Existing Name", // Another category's name
                    null, null
            );

            when(categoryRepository.findById(categoryId)).thenReturn(Optional.of(existingCategory));
            when(categoryRepository.existsByNameAndIdNot("Existing Name", categoryId)).thenReturn(true);

            // When & Then
            assertThatThrownBy(() -> commandService.updateMaterialCategory(categoryId, command))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Existing Name")
                    .hasMessageContaining("already exists");
        }

        @Test
        @DisplayName("should throw exception when category not found")
        void updateMaterialCategory_CategoryNotFound_ThrowsException() {
            // Given
            Long categoryId = 99999L;
            UpdateMaterialCategoryCommand command = new UpdateMaterialCategoryCommand(
                    "New Name", null, null
            );

            when(categoryRepository.findById(categoryId)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> commandService.updateMaterialCategory(categoryId, command))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Material category")
                    .hasMessageContaining("99999");
        }

        @Test
        @DisplayName("should update active status")
        void updateMaterialCategory_ActiveStatus_UpdatesStatus() {
            // Given
            Long categoryId = 1L;
            MaterialCategory existingCategory = createMaterialCategory(categoryId, "Category", true);

            UpdateMaterialCategoryCommand command = new UpdateMaterialCategoryCommand(
                    null, null, false
            );

            when(categoryRepository.findById(categoryId)).thenReturn(Optional.of(existingCategory));
            when(categoryRepository.save(any(MaterialCategory.class))).thenAnswer(invocation -> {
                MaterialCategory category = invocation.getArgument(0);
                assertThat(category.isActive()).isFalse();
                return category;
            });

            // When
            Long result = commandService.updateMaterialCategory(categoryId, command);

            // Then
            assertThat(result).isEqualTo(categoryId);
        }
    }

    // ==========================================================================
    // Deactivate Material Category Tests
    // ==========================================================================

    @Nested
    @DisplayName("Deactivate Material Category")
    class DeactivateMaterialCategoryTests {

        @Test
        @DisplayName("should deactivate active material category")
        void deactivateMaterialCategory_ActiveCategory_SetsInactive() {
            // Given
            Long categoryId = 1L;
            MaterialCategory activeCategory = createMaterialCategory(categoryId, "Active Category", true);

            when(categoryRepository.findById(categoryId)).thenReturn(Optional.of(activeCategory));
            when(categoryRepository.save(any(MaterialCategory.class))).thenAnswer(invocation -> {
                MaterialCategory category = invocation.getArgument(0);
                assertThat(category.isActive()).isFalse();
                return category;
            });

            // When
            commandService.deactivateMaterialCategory(categoryId);

            // Then
            verify(categoryRepository).save(any(MaterialCategory.class));
        }

        @Test
        @DisplayName("should throw exception when category not found")
        void deactivateMaterialCategory_CategoryNotFound_ThrowsException() {
            // Given
            Long categoryId = 99999L;

            when(categoryRepository.findById(categoryId)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> commandService.deactivateMaterialCategory(categoryId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Material category")
                    .hasMessageContaining("99999");
        }

        @Test
        @DisplayName("should allow deactivating already inactive category (idempotent)")
        void deactivateMaterialCategory_AlreadyInactive_SetsInactive() {
            // Given
            Long categoryId = 1L;
            MaterialCategory inactiveCategory = createMaterialCategory(categoryId, "Inactive Category", false);

            when(categoryRepository.findById(categoryId)).thenReturn(Optional.of(inactiveCategory));
            when(categoryRepository.save(any(MaterialCategory.class))).thenReturn(inactiveCategory);

            // When
            commandService.deactivateMaterialCategory(categoryId);

            // Then
            verify(categoryRepository).save(any(MaterialCategory.class));
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
}
