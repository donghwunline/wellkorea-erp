/**
 * Quotation Mapper Tests.
 *
 * Tests for DTO → Domain model transformations.
 */

import { describe, expect, it } from 'vitest';
import {
  quotationMapper,
  type QuotationDetailsResponse,
  type LineItemResponse,
} from './quotation.mapper';
import { expectDomainShape, expectTrimmedStrings } from '@/test/entity-test-utils';

// =============================================================================
// Test Data Factories
// =============================================================================

function createMockLineItemResponse(
  overrides?: Partial<LineItemResponse>
): LineItemResponse {
  return {
    id: 1,
    productId: 100,
    productSku: 'SKU-001',
    productName: 'Test Product',
    sequence: 1,
    quantity: 10,
    unitPrice: 50000,
    lineTotal: 500000,
    notes: null,
    ...overrides,
  };
}

function createMockQuotationResponse(
  overrides?: Partial<QuotationDetailsResponse>
): QuotationDetailsResponse {
  return {
    id: 1,
    projectId: 1,
    projectName: 'Test Project',
    jobCode: 'WK22025-000001-20250101',
    version: 1,
    status: 'DRAFT',
    quotationDate: '2025-01-15',
    validityDays: 30,
    expiryDate: '2025-02-14',
    totalAmount: 1000000,
    notes: null,
    createdById: 1,
    createdByName: 'Test User',
    submittedAt: null,
    approvedAt: null,
    approvedById: null,
    approvedByName: null,
    rejectionReason: null,
    createdAt: '2025-01-15T00:00:00Z',
    updatedAt: '2025-01-15T00:00:00Z',
    lineItems: [createMockLineItemResponse()],
    ...overrides,
  };
}

describe('quotationMapper', () => {
  // ==========================================================================
  // toDomain Tests
  // ==========================================================================

  describe('toDomain()', () => {
    it('should map all required fields correctly', () => {
      const response = createMockQuotationResponse();
      const result = quotationMapper.toDomain(response);

      expectDomainShape(result, [
        'id',
        'projectId',
        'projectName',
        'jobCode',
        'version',
        'status',
        'quotationDate',
        'validityDays',
        'expiryDate',
        'totalAmount',
        'notes',
        'createdById',
        'createdByName',
        'submittedAt',
        'approvedAt',
        'approvedById',
        'approvedByName',
        'rejectionReason',
        'createdAt',
        'updatedAt',
        'lineItems',
      ]);
    });

    it('should preserve field values correctly', () => {
      const response = createMockQuotationResponse();
      const result = quotationMapper.toDomain(response);

      expect(result.id).toBe(1);
      expect(result.projectId).toBe(1);
      expect(result.jobCode).toBe('WK22025-000001-20250101');
      expect(result.version).toBe(1);
      expect(result.validityDays).toBe(30);
      expect(result.totalAmount).toBe(1000000);
    });

    it('should cast status string to QuotationStatus', () => {
      const response = createMockQuotationResponse({ status: 'PENDING' });
      const result = quotationMapper.toDomain(response);

      expect(result.status).toBe('PENDING');
    });

    it('should trim whitespace from string fields', () => {
      const response = createMockQuotationResponse({
        projectName: '  Test Project  ',
        createdByName: '  Admin User  ',
      });
      const result = quotationMapper.toDomain(response);

      expectTrimmedStrings(result, ['projectName', 'createdByName']);
      expect(result.projectName).toBe('Test Project');
      expect(result.createdByName).toBe('Admin User');
    });

    it('should handle null notes field', () => {
      const response = createMockQuotationResponse({ notes: null });
      const result = quotationMapper.toDomain(response);

      expect(result.notes).toBeNull();
    });

    it('should trim notes when present', () => {
      const response = createMockQuotationResponse({ notes: '  Some notes  ' });
      const result = quotationMapper.toDomain(response);

      expect(result.notes).toBe('Some notes');
    });

    it('should handle null approvedByName', () => {
      const response = createMockQuotationResponse({ approvedByName: null });
      const result = quotationMapper.toDomain(response);

      expect(result.approvedByName).toBeNull();
    });

    it('should trim approvedByName when present', () => {
      const response = createMockQuotationResponse({
        approvedByName: '  Approver Name  ',
      });
      const result = quotationMapper.toDomain(response);

      expect(result.approvedByName).toBe('Approver Name');
    });

    it('should handle null rejectionReason', () => {
      const response = createMockQuotationResponse({ rejectionReason: null });
      const result = quotationMapper.toDomain(response);

      expect(result.rejectionReason).toBeNull();
    });

    it('should trim rejectionReason when present', () => {
      const response = createMockQuotationResponse({
        rejectionReason: '  Price too high  ',
      });
      const result = quotationMapper.toDomain(response);

      expect(result.rejectionReason).toBe('Price too high');
    });

    it('should map empty lineItems array', () => {
      const response = createMockQuotationResponse({ lineItems: [] });
      const result = quotationMapper.toDomain(response);

      expect(result.lineItems).toEqual([]);
    });

    it('should map null lineItems to empty array', () => {
      const response = createMockQuotationResponse({ lineItems: null });
      const result = quotationMapper.toDomain(response);

      expect(result.lineItems).toEqual([]);
    });

    it('should map line items correctly', () => {
      const lineItem = createMockLineItemResponse({
        id: 5,
        productId: 200,
        productSku: 'SKU-TEST',
        productName: 'Test Item',
        quantity: 5,
        unitPrice: 10000,
        lineTotal: 50000,
      });
      const response = createMockQuotationResponse({ lineItems: [lineItem] });
      const result = quotationMapper.toDomain(response);

      expect(result.lineItems).toHaveLength(1);
      expect(result.lineItems[0]).toEqual({
        id: 5,
        productId: 200,
        productSku: 'SKU-TEST',
        productName: 'Test Item',
        sequence: 1,
        quantity: 5,
        unitPrice: 10000,
        lineTotal: 50000,
        notes: null,
      });
    });

    it('should trim line item notes when present', () => {
      const lineItem = createMockLineItemResponse({ notes: '  Item notes  ' });
      const response = createMockQuotationResponse({ lineItems: [lineItem] });
      const result = quotationMapper.toDomain(response);

      expect(result.lineItems[0].notes).toBe('Item notes');
    });

    it('should preserve date strings in ISO format', () => {
      const response = createMockQuotationResponse({
        quotationDate: '2025-01-15',
        expiryDate: '2025-02-14',
        createdAt: '2025-01-15T10:30:00Z',
        updatedAt: '2025-01-16T14:00:00Z',
        submittedAt: '2025-01-15T12:00:00Z',
        approvedAt: '2025-01-16T10:00:00Z',
      });
      const result = quotationMapper.toDomain(response);

      expect(result.quotationDate).toBe('2025-01-15');
      expect(result.expiryDate).toBe('2025-02-14');
      expect(result.createdAt).toBe('2025-01-15T10:30:00Z');
      expect(result.updatedAt).toBe('2025-01-16T14:00:00Z');
      expect(result.submittedAt).toBe('2025-01-15T12:00:00Z');
      expect(result.approvedAt).toBe('2025-01-16T10:00:00Z');
    });
  });

  // ==========================================================================
  // toListItem Tests
  // ==========================================================================

  describe('toListItem()', () => {
    it('should map only list-relevant fields', () => {
      const quotation = quotationMapper.toDomain(createMockQuotationResponse());
      const result = quotationMapper.toListItem(quotation);

      expectDomainShape(result, [
        'id',
        'jobCode',
        'projectId',
        'projectName',
        'version',
        'status',
        'totalAmount',
        'createdAt',
        'createdByName',
      ]);
    });

    it('should not include lineItems in list item', () => {
      const quotation = quotationMapper.toDomain(createMockQuotationResponse());
      const result = quotationMapper.toListItem(quotation);

      expect(result).not.toHaveProperty('lineItems');
    });

    it('should not include notes in list item', () => {
      const quotation = quotationMapper.toDomain(
        createMockQuotationResponse({ notes: 'Some notes' })
      );
      const result = quotationMapper.toListItem(quotation);

      expect(result).not.toHaveProperty('notes');
    });
  });

  // ==========================================================================
  // responseToListItem Tests
  // ==========================================================================

  describe('responseToListItem()', () => {
    it('should map response directly to list item', () => {
      const response = createMockQuotationResponse();
      const result = quotationMapper.responseToListItem(response);

      expect(result.id).toBe(response.id);
      expect(result.jobCode).toBe(response.jobCode);
      expect(result.projectId).toBe(response.projectId);
      expect(result.version).toBe(response.version);
      expect(result.status).toBe(response.status);
      expect(result.totalAmount).toBe(response.totalAmount);
      expect(result.createdAt).toBe(response.createdAt);
    });

    it('should trim projectName', () => {
      const response = createMockQuotationResponse({
        projectName: '  Test Project  ',
      });
      const result = quotationMapper.responseToListItem(response);

      expect(result.projectName).toBe('Test Project');
    });

    it('should trim createdByName', () => {
      const response = createMockQuotationResponse({
        createdByName: '  Admin  ',
      });
      const result = quotationMapper.responseToListItem(response);

      expect(result.createdByName).toBe('Admin');
    });

    it('should cast status string to QuotationStatus', () => {
      const response = createMockQuotationResponse({ status: 'APPROVED' });
      const result = quotationMapper.responseToListItem(response);

      expect(result.status).toBe('APPROVED');
    });

    it('should not include lineItems or notes', () => {
      const response = createMockQuotationResponse({
        notes: 'Some notes',
        lineItems: [createMockLineItemResponse()],
      });
      const result = quotationMapper.responseToListItem(response);

      expect(result).not.toHaveProperty('lineItems');
      expect(result).not.toHaveProperty('notes');
    });
  });
});
