/**
 * Update Company Mutation Hook.
 *
 * Handles updating an existing company with cache invalidation.
 *
 * Features Layer: Isolated user action
 * - Contains mutation logic
 * - Handles cache invalidation
 * - UX side-effects (toast) belong here
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  updateCompany,
  companyQueries,
  type UpdateCompanyInput,
  type CommandResult,
} from '@/entities/company';

export interface UpdateCompanyParams {
  id: number;
  input: UpdateCompanyInput;
}

export interface UseUpdateCompanyOptions {
  /**
   * Called on successful update.
   */
  onSuccess?: (result: CommandResult) => void;

  /**
   * Called on error.
   */
  onError?: (error: Error) => void;
}

/**
 * Hook for updating an existing company.
 *
 * @example
 * ```tsx
 * function EditCompanyPage({ companyId }: { companyId: number }) {
 *   const navigate = useNavigate();
 *   const { mutate, isPending, error } = useUpdateCompany({
 *     onSuccess: () => {
 *       toast.success('회사가 수정되었습니다');
 *       navigate(`/companies/${companyId}`);
 *     },
 *   });
 *
 *   const handleSubmit = (data: UpdateCompanyInput) => {
 *     mutate({ id: companyId, input: data });
 *   };
 *
 *   return <CompanyForm onSubmit={handleSubmit} isLoading={isPending} />;
 * }
 * ```
 */
export function useUpdateCompany(options: UseUpdateCompanyOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: UpdateCompanyParams) => updateCompany(id, input),

    onSuccess: (result, variables) => {
      // Invalidate both list and detail queries
      queryClient.invalidateQueries({ queryKey: companyQueries.lists() });
      queryClient.invalidateQueries({ queryKey: companyQueries.detail(variables.id).queryKey });
      options.onSuccess?.(result);
    },

    onError: (error: Error) => {
      options.onError?.(error);
    },
  });
}
