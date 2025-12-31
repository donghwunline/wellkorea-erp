/**
 * Chain Template Query Keys.
 *
 * TanStack Query key factory for chain templates.
 */

export const chainTemplateQueryKeys = {
  all: ['chain-templates'] as const,
  lists: () => [...chainTemplateQueryKeys.all, 'list'] as const,
  list: () => [...chainTemplateQueryKeys.lists()] as const,
  details: () => [...chainTemplateQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...chainTemplateQueryKeys.details(), id] as const,
};
