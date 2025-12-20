/**
 * Hook for project search.
 * Provides project search functionality for quotation forms.
 */

import { useCallback } from 'react';
import { projectService } from '@/services';
import type { ComboboxOption } from '@/components/ui/forms/Combobox';
import type { ProjectDetails } from '@/services';

export interface UseProjectSearchReturn {
  loadProjects: (query: string) => Promise<ComboboxOption[]>;
  getProject: (id: number) => Promise<ProjectDetails>;
}

/**
 * Hook that provides project search functionality.
 */
export function useProjectSearch(): UseProjectSearchReturn {
  const loadProjects = useCallback(async (query: string): Promise<ComboboxOption[]> => {
    const result = await projectService.getProjects({
      search: query,
      page: 0,
      size: 20,
    });
    return result.data.map(project => ({
      id: project.id,
      label: project.name,
      description: project.jobCode || undefined,
    }));
  }, []);

  const getProject = useCallback(async (id: number): Promise<ProjectDetails> => {
    return projectService.getProject(id);
  }, []);

  return {
    loadProjects,
    getProject,
  };
}
