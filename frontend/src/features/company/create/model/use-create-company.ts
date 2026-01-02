/**
 * Create Company Mutation Hook.
 *
 * Handles creating a new company with cache invalidation.
 *
 * Features Layer: Isolated user action
 * - Contains mutation logic
 * - Handles cache invalidation
 * - UX side-effects (toast) belong here
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createCompany,
  companyQueries,
  type CreateCompanyInput,
  type CommandResult,
} from '@/entities/company';

export interface UseCreateCompanyOptions {
  /**
   * Called on successful creation.
   */
  onSuccess?: (result: CommandResult) => void;

  /**
   * Called on error.
   */
  onError?: (error: Error) => void;
}

/**
 * Hook for creating a new company.
 *
 * @example
 * ```tsx
 * function CreateCompanyPage() {
 *   const navigate = useNavigate();
 *   const { mutate, isPending, error } = useCreateCompany({
 *     onSuccess: (result) => {
 *       toast.success('회사가 생성되었습니다');
 *       navigate(`/companies/${result.id}`);
 *     },
 *   });
 *
 *   const handleSubmit = (data: CreateCompanyInput) => {
 *     mutate(data);
 *   };
 *
 *   return <CompanyForm onSubmit={handleSubmit} isLoading={isPending} />;
 * }
 * ```
 */
export function useCreateCompany(options: UseCreateCompanyOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCompanyInput) => createCompany(input),

    onSuccess: result => {
      // Invalidate list queries to refetch
      queryClient.invalidateQueries({ queryKey: companyQueries.lists() });
      options.onSuccess?.(result);
    },

    onError: (error: Error) => {
      options.onError?.(error);
    },
  });
}
