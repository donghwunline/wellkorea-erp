/**
 * Catalog Mapper Tests.
 *
 * Tests for DTO → Domain model transformations.
 */

import { describe, expect, it } from 'vitest';
import {
  toServiceCategoryListItem,
  toServiceCategory,
  toVendorOffering,
  type ServiceCategorySummaryResponse,
  type ServiceCategoryDetailsResponse,
  type VendorOfferingResponse,
} from './catalog.mapper';
import { expectDomainShape } from '@/test/entity-test-utils';

// =============================================================================
// Test Data Factories
// =============================================================================

function createMockServiceCategorySummaryResponse(
  overrides?: Partial<ServiceCategorySummaryResponse>
): ServiceCategorySummaryResponse {
  return {
    id: 1,
    name: 'Laser Cutting',
    description: 'Metal cutting services',
    isActive: true,
    vendorCount: 5,
    ...overrides,
  };
}

function createMockServiceCategoryDetailsResponse(
  overrides?: Partial<ServiceCategoryDetailsResponse>
): ServiceCategoryDetailsResponse {
  return {
    id: 1,
    name: 'Laser Cutting',
    description: 'Metal cutting services',
    isActive: true,
    vendorCount: 5,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-02T00:00:00Z',
    ...overrides,
  };
}

function createMockVendorOfferingResponse(
  overrides?: Partial<VendorOfferingResponse>
): VendorOfferingResponse {
  return {
    id: 1,
    vendorId: 10,
    vendorName: 'ABC Manufacturing',
    serviceCategoryId: 1,
    serviceCategoryName: 'Laser Cutting',
    vendorServiceCode: 'LC-001',
    vendorServiceName: 'Standard Laser Cut',
    unitPrice: 5000,
    currency: 'KRW',
    leadTimeDays: 3,
    minOrderQuantity: 10,
    effectiveFrom: '2025-01-01',
    effectiveTo: '2025-12-31',
    isPreferred: true,
    notes: 'High quality vendor',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-02T00:00:00Z',
    ...overrides,
  };
}

describe('toServiceCategoryListItem()', () => {
  it('should map all required fields correctly', () => {
    const response = createMockServiceCategorySummaryResponse();
    const result = toServiceCategoryListItem(response);

    expectDomainShape(result, ['id', 'name', 'description', 'isActive', 'vendorCount']);
  });

  it('should preserve field values correctly', () => {
    const response = createMockServiceCategorySummaryResponse();
    const result = toServiceCategoryListItem(response);

    expect(result.id).toBe(1);
    expect(result.name).toBe('Laser Cutting');
    expect(result.description).toBe('Metal cutting services');
    expect(result.isActive).toBe(true);
    expect(result.vendorCount).toBe(5);
  });

  it('should handle null description', () => {
    const response = createMockServiceCategorySummaryResponse({
      description: null,
    });
    const result = toServiceCategoryListItem(response);

    expect(result.description).toBeNull();
  });

  it('should handle undefined description', () => {
    const response = createMockServiceCategorySummaryResponse({
      description: undefined,
    });
    const result = toServiceCategoryListItem(response);

    expect(result.description).toBeNull();
  });

  it('should handle inactive category', () => {
    const response = createMockServiceCategorySummaryResponse({
      isActive: false,
    });
    const result = toServiceCategoryListItem(response);

    expect(result.isActive).toBe(false);
  });

  it('should handle zero vendor count', () => {
    const response = createMockServiceCategorySummaryResponse({
      vendorCount: 0,
    });
    const result = toServiceCategoryListItem(response);

    expect(result.vendorCount).toBe(0);
  });
});

describe('toServiceCategory()', () => {
  it('should map all required fields correctly', () => {
    const response = createMockServiceCategoryDetailsResponse();
    const result = toServiceCategory(response);

    expectDomainShape(result, [
      'id',
      'name',
      'description',
      'isActive',
      'vendorCount',
      'createdAt',
      'updatedAt',
    ]);
  });

  it('should preserve field values correctly', () => {
    const response = createMockServiceCategoryDetailsResponse();
    const result = toServiceCategory(response);

    expect(result.id).toBe(1);
    expect(result.name).toBe('Laser Cutting');
    expect(result.description).toBe('Metal cutting services');
    expect(result.isActive).toBe(true);
    expect(result.vendorCount).toBe(5);
  });

  it('should handle null description', () => {
    const response = createMockServiceCategoryDetailsResponse({
      description: null,
    });
    const result = toServiceCategory(response);

    expect(result.description).toBeNull();
  });

  it('should preserve date strings in ISO format', () => {
    const response = createMockServiceCategoryDetailsResponse({
      createdAt: '2025-01-01T10:30:00Z',
      updatedAt: '2025-01-02T14:00:00Z',
    });
    const result = toServiceCategory(response);

    expect(result.createdAt).toBe('2025-01-01T10:30:00Z');
    expect(result.updatedAt).toBe('2025-01-02T14:00:00Z');
  });
});

describe('toVendorOffering()', () => {
  it('should map all required fields correctly', () => {
    const response = createMockVendorOfferingResponse();
    const result = toVendorOffering(response);

    expectDomainShape(result, [
      'id',
      'vendorId',
      'vendorName',
      'serviceCategoryId',
      'serviceCategoryName',
      'vendorServiceCode',
      'vendorServiceName',
      'unitPrice',
      'currency',
      'leadTimeDays',
      'minOrderQuantity',
      'effectiveFrom',
      'effectiveTo',
      'isPreferred',
      'notes',
      'createdAt',
      'updatedAt',
    ]);
  });

  it('should preserve field values correctly', () => {
    const response = createMockVendorOfferingResponse();
    const result = toVendorOffering(response);

    expect(result.id).toBe(1);
    expect(result.vendorId).toBe(10);
    expect(result.vendorName).toBe('ABC Manufacturing');
    expect(result.serviceCategoryId).toBe(1);
    expect(result.serviceCategoryName).toBe('Laser Cutting');
    expect(result.unitPrice).toBe(5000);
    expect(result.currency).toBe('KRW');
    expect(result.isPreferred).toBe(true);
  });

  it('should handle null vendorServiceCode', () => {
    const response = createMockVendorOfferingResponse({
      vendorServiceCode: null,
    });
    const result = toVendorOffering(response);

    expect(result.vendorServiceCode).toBeNull();
  });

  it('should handle undefined vendorServiceCode', () => {
    const response = createMockVendorOfferingResponse({
      vendorServiceCode: undefined,
    });
    const result = toVendorOffering(response);

    expect(result.vendorServiceCode).toBeNull();
  });

  it('should handle null vendorServiceName', () => {
    const response = createMockVendorOfferingResponse({
      vendorServiceName: null,
    });
    const result = toVendorOffering(response);

    expect(result.vendorServiceName).toBeNull();
  });

  it('should handle null unitPrice', () => {
    const response = createMockVendorOfferingResponse({
      unitPrice: null,
    });
    const result = toVendorOffering(response);

    expect(result.unitPrice).toBeNull();
  });

  it('should handle undefined unitPrice', () => {
    const response = createMockVendorOfferingResponse({
      unitPrice: undefined,
    });
    const result = toVendorOffering(response);

    expect(result.unitPrice).toBeNull();
  });

  it('should handle zero unitPrice', () => {
    const response = createMockVendorOfferingResponse({
      unitPrice: 0,
    });
    const result = toVendorOffering(response);

    expect(result.unitPrice).toBe(0);
  });

  it('should handle null leadTimeDays', () => {
    const response = createMockVendorOfferingResponse({
      leadTimeDays: null,
    });
    const result = toVendorOffering(response);

    expect(result.leadTimeDays).toBeNull();
  });

  it('should handle null minOrderQuantity', () => {
    const response = createMockVendorOfferingResponse({
      minOrderQuantity: null,
    });
    const result = toVendorOffering(response);

    expect(result.minOrderQuantity).toBeNull();
  });

  it('should handle null effectiveFrom and effectiveTo', () => {
    const response = createMockVendorOfferingResponse({
      effectiveFrom: null,
      effectiveTo: null,
    });
    const result = toVendorOffering(response);

    expect(result.effectiveFrom).toBeNull();
    expect(result.effectiveTo).toBeNull();
  });

  it('should handle null notes', () => {
    const response = createMockVendorOfferingResponse({
      notes: null,
    });
    const result = toVendorOffering(response);

    expect(result.notes).toBeNull();
  });

  it('should handle non-preferred vendor', () => {
    const response = createMockVendorOfferingResponse({
      isPreferred: false,
    });
    const result = toVendorOffering(response);

    expect(result.isPreferred).toBe(false);
  });
});
