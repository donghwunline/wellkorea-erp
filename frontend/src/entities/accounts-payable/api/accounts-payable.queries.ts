/**
 * AccountsPayable Query Factory.
 *
 * Provides TanStack Query v5 queryOptions for accounts payable data fetching.
 * Usage: useQuery(accountsPayableQueries.list(...))
 */

import { queryOptions } from '@tanstack/react-query';
import type { CalculatedAPStatus } from '../model/accounts-payable-status';
import type { AccountsPayable, APAgingSummary } from '../model/accounts-payable';
import {
  getAccountsPayableList,
  getAccountsPayableById,
  getAccountsPayableByVendor,
  getOverdueAccountsPayable,
  getAPAgingSummary,
} from './get-accounts-payable';

/**
 * Query keys for accounts payable queries.
 */
const keys = {
  all: ['accounts-payable'] as const,
  lists: () => [...keys.all, 'list'] as const,
  list: (
    page: number,
    size: number,
    vendorId: number | undefined,
    status: CalculatedAPStatus | undefined,
    overdueOnly: boolean | undefined
  ) => [...keys.lists(), page, size, vendorId, status, overdueOnly] as const,
  details: () => [...keys.all, 'detail'] as const,
  detail: (id: number) => [...keys.details(), id] as const,
  byVendor: (vendorId: number) => [...keys.all, 'by-vendor', vendorId] as const,
  overdue: () => [...keys.all, 'overdue'] as const,
  aging: () => [...keys.all, 'aging'] as const,
};

/**
 * Accounts payable query factory.
 */
export const accountsPayableQueries = {
  /**
   * Get all query keys (for invalidation).
   */
  all: () => keys.all,

  /**
   * Get list query keys (for invalidation).
   */
  lists: () => keys.lists(),

  /**
   * Query options for paginated accounts payable list.
   */
  list: (
    page: number = 0,
    size: number = 20,
    vendorId?: number,
    calculatedStatus?: CalculatedAPStatus,
    overdueOnly?: boolean
  ) =>
    queryOptions<AccountsPayable[]>({
      queryKey: keys.list(page, size, vendorId, calculatedStatus, overdueOnly),
      queryFn: () => getAccountsPayableList(page, size, vendorId, calculatedStatus, overdueOnly),
    }),

  /**
   * Query options for accounts payable detail.
   */
  detail: (id: number) =>
    queryOptions<AccountsPayable>({
      queryKey: keys.detail(id),
      queryFn: () => getAccountsPayableById(id),
      enabled: id > 0,
    }),

  /**
   * Query options for accounts payable by vendor.
   */
  byVendor: (vendorId: number) =>
    queryOptions<AccountsPayable[]>({
      queryKey: keys.byVendor(vendorId),
      queryFn: () => getAccountsPayableByVendor(vendorId),
      enabled: vendorId > 0,
    }),

  /**
   * Query options for overdue accounts payable.
   */
  overdue: () =>
    queryOptions<AccountsPayable[]>({
      queryKey: keys.overdue(),
      queryFn: () => getOverdueAccountsPayable(),
    }),

  /**
   * Query options for AP aging summary.
   */
  aging: () =>
    queryOptions<APAgingSummary[]>({
      queryKey: keys.aging(),
      queryFn: () => getAPAgingSummary(),
    }),
};
