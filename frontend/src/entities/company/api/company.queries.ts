/**
 * Company Query Factory.
 *
 * Centralized query factory following TanStack Query v5 + FSD pattern.
 * Combines query keys and functions using queryOptions for type safety.
 *
 * Usage:
 * - Direct in components: useQuery(companyQueries.detail(id))
 * - Prefetching: queryClient.prefetchQuery(companyQueries.detail(id))
 * - Invalidation: queryClient.invalidateQueries({ queryKey: companyQueries.lists() })
 */

import { queryOptions, keepPreviousData } from '@tanstack/react-query';
import type { Company, CompanyListItem } from '../model/company';
import type { RoleType } from '../model/role-type';
import type { Paginated } from '@/shared/lib/pagination';
import { companyMapper } from './company.mapper';
import { getCompany, getCompanies } from './get-company';

/**
 * Parameters for company list query.
 * Uses primitives for stable query keys.
 */
export interface CompanyListQueryParams {
  page: number;
  size: number;
  search: string;
  roleType: RoleType | null;
}

/**
 * Company query factory.
 *
 * Follows FSD pattern with hierarchical keys and queryOptions.
 * All queries return domain models (not DTOs).
 */
export const companyQueries = {
  /**
   * Base key for all company queries.
   */
  all: () => ['companies'] as const,

  /**
   * Base key for list queries.
   */
  lists: () => [...companyQueries.all(), 'list'] as const,

  /**
   * Paginated list query with filters.
   *
   * @example
   * const { data } = useQuery(companyQueries.list({
   *   page: 0, size: 10, search: '', roleType: null
   * }));
   */
  list: (params: CompanyListQueryParams) =>
    queryOptions({
      queryKey: [
        ...companyQueries.lists(),
        params.page,
        params.size,
        params.search,
        params.roleType,
      ] as const,
      queryFn: async (): Promise<Paginated<CompanyListItem>> => {
        const response = await getCompanies({
          page: params.page,
          size: params.size,
          search: params.search || undefined,
          roleType: params.roleType ?? undefined,
        });

        return {
          data: response.data.map(companyMapper.toListItem),
          pagination: response.pagination,
        };
      },
      placeholderData: keepPreviousData,
    }),

  /**
   * Base key for detail queries.
   */
  details: () => [...companyQueries.all(), 'detail'] as const,

  /**
   * Single company detail query.
   *
   * @example
   * const { data: company } = useQuery(companyQueries.detail(123));
   * if (companyRules.canEdit(company)) { ... }
   */
  detail: (id: number) =>
    queryOptions({
      queryKey: [...companyQueries.details(), id] as const,
      queryFn: async (): Promise<Company> => {
        const dto = await getCompany(id);
        return companyMapper.toDomain(dto);
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
    }),
};
