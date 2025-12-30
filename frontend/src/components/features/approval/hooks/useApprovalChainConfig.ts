/**
 * Hook for approval chain configuration.
 * Fetches and manages approval chain templates.
 */

import { useCallback, useEffect, useState } from 'react';
import type { ChainLevelRequest, ChainTemplate } from '@/services';
import { approvalChainService, userService } from '@/services';
import type { ComboboxOption } from '@/shared/ui/forms/Combobox.tsx';

export interface UseApprovalChainConfigReturn {
  templates: ChainTemplate[];
  isLoading: boolean;
  error: string | null;
  isSaving: boolean;
  saveError: string | null;
  refetch: () => void;
  updateChainLevels: (templateId: number, levels: ChainLevelRequest[]) => Promise<void>;
  loadUsers: (query: string) => Promise<ComboboxOption[]>;
  clearSaveError: () => void;
}

/**
 * Hook that provides approval chain configuration functionality.
 */
export function useApprovalChainConfig(): UseApprovalChainConfigReturn {
  const [templates, setTemplates] = useState<ChainTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await approvalChainService.getChainTemplates();
      setTemplates(data);
    } catch {
      setError('Failed to load approval chain templates');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const updateChainLevels = useCallback(
    async (templateId: number, levels: ChainLevelRequest[]) => {
      setIsSaving(true);
      setSaveError(null);

      try {
        // CQRS: Command returns CommandResult, then we refetch fresh data
        await approvalChainService.updateChainLevels(templateId, levels);
        await refetch();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update chain levels';
        setSaveError(message);
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [refetch]
  );

  const loadUsers = useCallback(async (query: string): Promise<ComboboxOption[]> => {
    const result = await userService.getUsers({
      search: query,
      page: 0,
      size: 20,
    });
    return result.data.map(user => ({
      id: user.id,
      label: user.fullName || user.username,
      description: user.email,
    }));
  }, []);

  const clearSaveError = useCallback(() => {
    setSaveError(null);
  }, []);

  return {
    templates,
    isLoading,
    error,
    isSaving,
    saveError,
    refetch,
    updateChainLevels,
    loadUsers,
    clearSaveError,
  };
}
