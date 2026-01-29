package com.wellkorea.backend.purchasing.infrastructure.service;

import com.wellkorea.backend.company.domain.Company;
import com.wellkorea.backend.company.domain.vo.CompanyRole;
import com.wellkorea.backend.company.domain.vo.RoleType;
import com.wellkorea.backend.company.infrastructure.persistence.CompanyRepository;
import com.wellkorea.backend.purchasing.domain.vo.RfqItem;
import com.wellkorea.backend.purchasing.domain.vo.RfqItemStatus;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

/**
 * Unit tests for RfqItemFactoryImpl.
 */
@Tag("unit")
@DisplayName("RfqItemFactoryImpl")
@ExtendWith(MockitoExtension.class)
class RfqItemFactoryImplTest {

    @Mock
    private CompanyRepository companyRepository;

    @InjectMocks
    private RfqItemFactoryImpl rfqItemFactory;

    @Nested
    @DisplayName("createRfqItems")
    class CreateRfqItems {

        @Test
        @DisplayName("should create RfqItems for valid vendors")
        void shouldCreateRfqItemsForValidVendors() {
            // Given
            Company vendor = createCompanyWithRole(1L, "Vendor A", RoleType.VENDOR);
            when(companyRepository.findById(1L)).thenReturn(Optional.of(vendor));

            // When
            List<RfqItem> items = rfqItemFactory.createRfqItems(List.of(1L));

            // Then
            assertThat(items).hasSize(1);
            assertThat(items.get(0).getVendorCompanyId()).isEqualTo(1L);
            assertThat(items.get(0).getVendorOfferingId()).isNull();
            assertThat(items.get(0).getStatus()).isEqualTo(RfqItemStatus.SENT);
            assertThat(items.get(0).getItemId()).isNotBlank();
            assertThat(items.get(0).getSentAt()).isNotNull();
        }

        @Test
        @DisplayName("should create RfqItems for multiple vendors")
        void shouldCreateRfqItemsForMultipleVendors() {
            // Given
            Company vendor1 = createCompanyWithRole(1L, "Vendor A", RoleType.VENDOR);
            Company vendor2 = createCompanyWithRole(2L, "Vendor B", RoleType.OUTSOURCE);
            when(companyRepository.findById(1L)).thenReturn(Optional.of(vendor1));
            when(companyRepository.findById(2L)).thenReturn(Optional.of(vendor2));

            // When
            List<RfqItem> items = rfqItemFactory.createRfqItems(List.of(1L, 2L));

            // Then
            assertThat(items).hasSize(2);
            assertThat(items.get(0).getVendorCompanyId()).isEqualTo(1L);
            assertThat(items.get(1).getVendorCompanyId()).isEqualTo(2L);
        }

        @Test
        @DisplayName("should accept OUTSOURCE role companies")
        void shouldAcceptOutsourceRoleCompanies() {
            // Given
            Company outsource = createCompanyWithRole(1L, "Outsource Co", RoleType.OUTSOURCE);
            when(companyRepository.findById(1L)).thenReturn(Optional.of(outsource));

            // When
            List<RfqItem> items = rfqItemFactory.createRfqItems(List.of(1L));

            // Then
            assertThat(items).hasSize(1);
            assertThat(items.get(0).getVendorCompanyId()).isEqualTo(1L);
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException for non-existent vendor")
        void shouldThrowResourceNotFoundExceptionForNonExistentVendor() {
            // Given
            when(companyRepository.findById(999L)).thenReturn(Optional.empty());

            // When / Then
            assertThatThrownBy(() -> rfqItemFactory.createRfqItems(List.of(999L)))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Vendor not found with ID: 999");
        }

        @Test
        @DisplayName("should throw IllegalArgumentException for company without VENDOR or OUTSOURCE role")
        void shouldThrowIllegalArgumentExceptionForCompanyWithoutVendorRole() {
            // Given
            Company customer = createCompanyWithRole(1L, "Customer Inc", RoleType.CUSTOMER);
            when(companyRepository.findById(1L)).thenReturn(Optional.of(customer));

            // When / Then
            assertThatThrownBy(() -> rfqItemFactory.createRfqItems(List.of(1L)))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Company with ID 1 is not a vendor");
        }

        @Test
        @DisplayName("should generate unique item IDs for each RfqItem")
        void shouldGenerateUniqueItemIdsForEachRfqItem() {
            // Given
            Company vendor = createCompanyWithRole(1L, "Vendor A", RoleType.VENDOR);
            when(companyRepository.findById(1L)).thenReturn(Optional.of(vendor));

            // When
            List<RfqItem> items1 = rfqItemFactory.createRfqItems(List.of(1L));
            List<RfqItem> items2 = rfqItemFactory.createRfqItems(List.of(1L));

            // Then
            assertThat(items1.get(0).getItemId()).isNotEqualTo(items2.get(0).getItemId());
        }
    }

    private Company createCompanyWithRole(Long id, String name, RoleType roleType) {
        Company company = Company.builder()
                .id(id)
                .name(name)
                .registrationNumber("123-45-6789" + id)
                .build();
        // Add the role after building
        CompanyRole role = CompanyRole.builder()
                .roleType(roleType)
                .build();
        company.addRole(role);
        return company;
    }
}
