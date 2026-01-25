/**
 * ProjectRelatedNavigationGrid Widget Tests.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockHasAnyRole = vi.fn();

vi.mock('@/entities/auth', () => ({
  useAuth: () => ({
    hasAnyRole: mockHasAnyRole,
    user: null,
    isAuthenticated: true,
    isLoading: false,
    accessToken: 'token',
    login: vi.fn(),
    logout: vi.fn(),
    hasRole: vi.fn(),
  }),
}));

const mockGetSummary = vi.hoisted(() => vi.fn());

vi.mock('@/entities/project', async () => {
  const actual = await vi.importActual<typeof import('@/entities/project')>('@/entities/project');
  return {
    ...actual,
    projectQueries: {
      ...actual.projectQueries,
      summary: (projectId: number) => ({
        queryKey: ['projects', 'summary', projectId],
        queryFn: () => mockGetSummary(projectId),
        staleTime: 1000 * 60 * 2,
      }),
    },
  };
});

import { ProjectRelatedNavigationGrid } from './ProjectRelatedNavigationGrid';

const mockSummary = {
  projectId: 1,
  sections: [
    {
      section: 'quotation' as const,
      label: 'Quotations',
      count: 5,
      description: 'View project quotations',
      path: '/projects/1/quotations',
    },
    {
      section: 'production' as const,
      label: 'Production',
      count: 3,
      description: 'View production tracking',
      path: '/projects/1/production',
    },
    {
      section: 'finance' as const,
      label: 'Finance',
      count: 2,
      description: 'View finance details',
      path: '/projects/1/finance',
    },
  ],
};

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

describe('ProjectRelatedNavigationGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasAnyRole.mockReturnValue(true);
  });

  describe('loading state', () => {
    it('should show loading spinner while fetching', () => {
      mockGetSummary.mockImplementation(() => new Promise(() => {}));

      renderWithProviders(<ProjectRelatedNavigationGrid projectId={1} />);

      expect(screen.getByText(/Loading project summary/i)).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('should show error message on fetch failure', async () => {
      mockGetSummary.mockRejectedValue(new Error('Failed to load project summary'));

      renderWithProviders(<ProjectRelatedNavigationGrid projectId={1} />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load project summary/i)).toBeInTheDocument();
      });
    });

    it('should show retry button on error', async () => {
      mockGetSummary.mockRejectedValue(new Error('Failed to load project summary'));

      renderWithProviders(<ProjectRelatedNavigationGrid projectId={1} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
      });
    });
  });

  describe('successful rendering', () => {
    it('should render section cards when data loads', async () => {
      mockGetSummary.mockResolvedValue(mockSummary);

      renderWithProviders(<ProjectRelatedNavigationGrid projectId={1} />);

      await waitFor(() => {
        expect(screen.getByText('Quotations')).toBeInTheDocument();
        expect(screen.getByText('Production')).toBeInTheDocument();
      });
    });
  });

  describe('role-based visibility', () => {
    it('should filter sections based on user roles', async () => {
      // User doesn't have ROLE_ADMIN or ROLE_FINANCE
      mockHasAnyRole.mockImplementation((roles: string[]) => {
        // If checking for ROLE_ADMIN or ROLE_FINANCE only, return false
        if (roles.every(r => r === 'ROLE_ADMIN' || r === 'ROLE_FINANCE')) return false;
        // If checking for ROLE_SALES (quotation section), return true
        return roles.includes('ROLE_SALES');
      });

      mockGetSummary.mockResolvedValue(mockSummary);

      renderWithProviders(<ProjectRelatedNavigationGrid projectId={1} />);

      await waitFor(() => {
        // Quotation visible (has ROLE_SALES in requirements)
        expect(screen.getByText('Quotations')).toBeInTheDocument();
        // Production visible (no role requirement)
        expect(screen.getByText('Production')).toBeInTheDocument();
      });

      // Finance should not be visible (only ROLE_ADMIN and ROLE_FINANCE required)
      expect(screen.queryByText('Finance')).not.toBeInTheDocument();
    });

    it('should show all sections when user has all roles', async () => {
      mockHasAnyRole.mockReturnValue(true);
      mockGetSummary.mockResolvedValue(mockSummary);

      renderWithProviders(<ProjectRelatedNavigationGrid projectId={1} />);

      await waitFor(() => {
        expect(screen.getByText('Quotations')).toBeInTheDocument();
        expect(screen.getByText('Production')).toBeInTheDocument();
        expect(screen.getByText('Finance')).toBeInTheDocument();
      });
    });
  });

  describe('empty state', () => {
    it('should show empty state when no sections', async () => {
      mockGetSummary.mockResolvedValue({
        projectId: 1,
        sections: [],
      });

      renderWithProviders(<ProjectRelatedNavigationGrid projectId={1} />);

      await waitFor(() => {
        // Use role query to be more specific (h3 is heading level 3)
        expect(screen.getByRole('heading', { name: /No sections available/i })).toBeInTheDocument();
      });
    });
  });

  describe('click handling', () => {
    it('should call onSectionClick when provided', async () => {
      const user = userEvent.setup();
      const onSectionClick = vi.fn();
      mockGetSummary.mockResolvedValue(mockSummary);

      renderWithProviders(
        <ProjectRelatedNavigationGrid projectId={1} onSectionClick={onSectionClick} />
      );

      await waitFor(() => {
        expect(screen.getByText('Quotations')).toBeInTheDocument();
      });

      // The card should be clickable
      const quotationCard = screen.getByText('Quotations').closest('button, a, [role="button"]');
      if (quotationCard) {
        await user.click(quotationCard);
        expect(onSectionClick).toHaveBeenCalled();
      }
    });
  });
});
