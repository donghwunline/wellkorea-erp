/**
 * AccountsPayable Query Factory Tests.
 *
 * Tests for query key structure, queryOptions configuration, and queryFn behavior.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { accountsPayableQueries } from './accounts-payable.queries';
import { expectQueryKey, expectValidQueryOptions, invokeQueryFn } from '@/test/entity-test-utils';
import type { CalculatedAPStatus } from '../model/accounts-payable-status';
import type { AccountsPayable, AccountsPayableDetail } from '../model/accounts-payable';
import type { VendorPayment } from '../model/vendor-payment';
// Import mocked modules
import { getAccountsPayableById, getAccountsPayableList, getAPAgingSummary } from './get-accounts-payable';

// Mock dependencies
vi.mock('./get-accounts-payable', () => ({
  getAccountsPayableList: vi.fn(),
  getAccountsPayableById: vi.fn(),
  getAPAgingSummary: vi.fn(),
}));

// =============================================================================
// Test Data Factories
// =============================================================================

function createMockAccountsPayable(overrides?: Partial<AccountsPayable>): AccountsPayable {
  return {
    id: 1,
    causeType: 'PURCHASE_ORDER',
    causeId: 100,
    causeReferenceNumber: 'PO-2025-000001',
    vendorId: 5,
    vendorName: 'Test Vendor',
    totalAmount: 1000,
    currency: 'KRW',
    dueDate: '2025-03-01',
    notes: null,
    createdAt: '2025-01-15T00:00:00Z',
    totalPaid: 0,
    remainingBalance: 1000,
    isOverdue: false,
    daysOverdue: 0,
    agingBucket: 'Current',
    calculatedStatus: 'PENDING' as CalculatedAPStatus,
    ...overrides,
  };
}

function createMockVendorPayment(overrides?: Partial<VendorPayment>): VendorPayment {
  return {
    id: 1,
    accountsPayableId: 123,
    paymentDate: '2025-02-01',
    amount: 500,
    paymentMethod: 'BANK_TRANSFER',
    referenceNumber: 'PAY-001',
    notes: null,
    recordedById: 1,
    recordedByName: 'Admin',
    createdAt: '2025-02-01T10:00:00Z',
    ...overrides,
  };
}

function createMockAccountsPayableDetail(overrides?: Partial<AccountsPayableDetail>): AccountsPayableDetail {
  return {
    ...createMockAccountsPayable(),
    id: 123,
    notes: 'Test notes',
    totalPaid: 500,
    remainingBalance: 500,
    calculatedStatus: 'PARTIALLY_PAID' as CalculatedAPStatus,
    payments: [],
    ...overrides,
  };
}

describe('accountsPayableQueries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // Query Key Structure Tests
  // ==========================================================================

  describe('query key structure', () => {
    describe('all()', () => {
      it('should return base query key', () => {
        expectQueryKey(accountsPayableQueries.all(), ['accounts-payable']);
      });
    });

    describe('lists()', () => {
      it('should return list query key with "list" segment', () => {
        expectQueryKey(accountsPayableQueries.lists(), ['accounts-payable', 'list']);
      });
    });
  });

  // ==========================================================================
  // List Query Tests
  // ==========================================================================

  describe('list()', () => {
    it('should return valid queryOptions', () => {
      const options = accountsPayableQueries.list();
      expectValidQueryOptions(options);
    });

    it('should include all filter params in query key for cache separation', () => {
      const options = accountsPayableQueries.list(
        1,           // page
        25,          // size
        5,           // vendorId
        'PENDING',   // calculatedStatus
        true,        // overdueOnly
        '2024-01-01', // dueDateFrom
        '2024-12-31'  // dueDateTo
      );

      expect(options.queryKey).toEqual([
        'accounts-payable',
        'list',
        1,
        25,
        5,
        'PENDING',
        true,
        '2024-01-01',
        '2024-12-31',
      ]);
    });

    it('should use default values when params are not provided', () => {
      const options = accountsPayableQueries.list();

      expect(options.queryKey).toEqual([
        'accounts-payable',
        'list',
        0,          // default page
        20,         // default size
        undefined,  // vendorId
        undefined,  // calculatedStatus
        undefined,  // overdueOnly
        undefined,  // dueDateFrom
        undefined,  // dueDateTo
      ]);
    });

    it('should call getAccountsPayableList with correct params in queryFn', async () => {
      const mockResponse = [createMockAccountsPayable()];
      vi.mocked(getAccountsPayableList).mockResolvedValue(mockResponse);

      const options = accountsPayableQueries.list(1, 25, 5, 'PENDING', false, '2024-01-01', '2024-12-31');
      await invokeQueryFn(options);

      expect(getAccountsPayableList).toHaveBeenCalledWith(
        1,           // page
        25,          // size
        5,           // vendorId
        'PENDING',   // calculatedStatus
        false,       // overdueOnly
        '2024-01-01', // dueDateFrom
        '2024-12-31'  // dueDateTo
      );
    });

    it('should return AP list from queryFn', async () => {
      const mockResponse = [createMockAccountsPayable()];
      vi.mocked(getAccountsPayableList).mockResolvedValue(mockResponse);

      const options = accountsPayableQueries.list();
      const result = await invokeQueryFn(options);

      expect(result).toEqual(mockResponse);
    });
  });

  // ==========================================================================
  // Detail Query Tests
  // ==========================================================================

  describe('detail()', () => {
    it('should return valid queryOptions', () => {
      const options = accountsPayableQueries.detail(123);
      expectValidQueryOptions(options);
    });

    it('should include id in query key', () => {
      const options = accountsPayableQueries.detail(123);
      expect(options.queryKey).toEqual(['accounts-payable', 'detail', 123]);
    });

    it('should be enabled when id > 0', () => {
      const options = accountsPayableQueries.detail(123);
      expect(options.enabled).toBe(true);
    });

    it('should be disabled when id <= 0', () => {
      const options1 = accountsPayableQueries.detail(0);
      const options2 = accountsPayableQueries.detail(-1);

      expect(options1.enabled).toBe(false);
      expect(options2.enabled).toBe(false);
    });

    it('should call getAccountsPayableById with correct id in queryFn', async () => {
      const mockResponse = createMockAccountsPayableDetail();
      vi.mocked(getAccountsPayableById).mockResolvedValue(mockResponse);

      const options = accountsPayableQueries.detail(123);
      await invokeQueryFn(options);

      expect(getAccountsPayableById).toHaveBeenCalledWith(123);
    });

    it('should return AP detail with payments from queryFn', async () => {
      const mockPayment = createMockVendorPayment();
      const mockResponse = createMockAccountsPayableDetail({ payments: [mockPayment] });
      vi.mocked(getAccountsPayableById).mockResolvedValue(mockResponse);

      const options = accountsPayableQueries.detail(123);
      const result = await invokeQueryFn<AccountsPayableDetail>(options);

      expect(result).toEqual(mockResponse);
      expect(result.payments).toHaveLength(1);
    });

    it('should generate different query keys for different ids', () => {
      const key1 = accountsPayableQueries.detail(1).queryKey;
      const key2 = accountsPayableQueries.detail(2).queryKey;

      expect(key1).not.toEqual(key2);
      expect(key1[2]).toBe(1);
      expect(key2[2]).toBe(2);
    });
  });

  // ==========================================================================
  // Aging Query Tests
  // ==========================================================================

  describe('aging()', () => {
    it('should return valid queryOptions', () => {
      const options = accountsPayableQueries.aging();
      expectValidQueryOptions(options);
    });

    it('should have correct query key', () => {
      const options = accountsPayableQueries.aging();
      expect(options.queryKey).toEqual(['accounts-payable', 'aging']);
    });

    it('should call getAPAgingSummary in queryFn', async () => {
      const mockResponse = [
        { agingBucket: 'Current', count: 10, totalAmount: 5000000, totalPaid: 1000000, remainingBalance: 4000000 },
        { agingBucket: '1-30 Days', count: 3, totalAmount: 1500000, totalPaid: 0, remainingBalance: 1500000 },
      ];
      vi.mocked(getAPAgingSummary).mockResolvedValue(mockResponse);

      const options = accountsPayableQueries.aging();
      const result = await invokeQueryFn(options);

      expect(getAPAgingSummary).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });
  });
});
