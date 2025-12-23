/**
 * Unit tests for ProjectRelatedNavigationGrid component.
 * Tests loading states, error handling, role-based filtering, and grid rendering.
 */

import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { ProjectRelatedNavigationGrid } from './ProjectRelatedNavigationGrid';
import type { ProjectSectionSummary, ProjectSummary } from '@/services';
import { useProjectSummary } from './hooks';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock useAuth hook
const mockHasAnyRole = vi.fn();
vi.mock('@/shared/hooks', () => ({
  useAuth: () => ({
    hasAnyRole: mockHasAnyRole,
  }),
}));

// Mock useProjectSummary hook
const mockRefetch = vi.fn();
vi.mock('./hooks', () => ({
  useProjectSummary: vi.fn(),
}));

const mockUseProjectSummary = useProjectSummary as Mock;

// Helper to create mock section summary
function createMockSectionSummary(
  section: ProjectSectionSummary['section'],
  overrides: Partial<ProjectSectionSummary> = {}
): ProjectSectionSummary {
  const labels: Record<string, string> = {
    quotation: '견적',
    process: '공정/진행률',
    outsource: '외주',
    delivery: '납품',
    documents: '도면/문서',
    finance: '정산',
  };

  return {
    section,
    label: labels[section],
    totalCount: 5,
    pendingCount: 2,
    lastUpdated: '2025-01-15T10:30:00Z',
    ...overrides,
  };
}

// Helper to create mock summary with all sections
function createMockFullSummary(projectId: number): ProjectSummary {
  return {
    projectId,
    sections: [
      createMockSectionSummary('quotation', { value: 15000000 }),
      createMockSectionSummary('process', { progressPercent: 60 }),
      createMockSectionSummary('outsource'),
      createMockSectionSummary('delivery'),
      createMockSectionSummary('documents'),
      createMockSectionSummary('finance', { value: 12000000 }),
    ],
  };
}

describe('ProjectRelatedNavigationGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: user has all roles
    mockHasAnyRole.mockReturnValue(true);
    mockRefetch.mockResolvedValue(undefined);
  });

  function renderGrid(projectId: number = 1) {
    return render(<ProjectRelatedNavigationGrid projectId={projectId} />);
  }

  describe('loading state', () => {
    it('should display loading spinner when fetching', () => {
      mockUseProjectSummary.mockReturnValue({
        summary: null,
        isLoading: true,
        error: null,
        refetch: mockRefetch,
      });

      renderGrid();

      expect(screen.getByText('Loading project summary...')).toBeInTheDocument();
    });

    it('should not display grid during loading', () => {
      mockUseProjectSummary.mockReturnValue({
        summary: null,
        isLoading: true,
        error: null,
        refetch: mockRefetch,
      });

      const { container } = renderGrid();

      // Grid should not be present
      expect(container.querySelector('.grid')).not.toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('should display error message when fetch fails', () => {
      mockUseProjectSummary.mockReturnValue({
        summary: null,
        isLoading: false,
        error: 'Failed to load project summary',
        refetch: mockRefetch,
      });

      renderGrid();

      expect(screen.getByText('Failed to load project summary')).toBeInTheDocument();
    });

    it('should display retry button on error', () => {
      mockUseProjectSummary.mockReturnValue({
        summary: null,
        isLoading: false,
        error: 'Network error',
        refetch: mockRefetch,
      });

      renderGrid();

      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should call refetch when retry button is clicked', async () => {
      const user = userEvent.setup();
      mockUseProjectSummary.mockReturnValue({
        summary: null,
        isLoading: false,
        error: 'Network error',
        refetch: mockRefetch,
      });

      renderGrid();

      await user.click(screen.getByRole('button', { name: /retry/i }));

      expect(mockRefetch).toHaveBeenCalledOnce();
    });
  });

  describe('empty state', () => {
    it('should display empty state when no sections', () => {
      mockUseProjectSummary.mockReturnValue({
        summary: { projectId: 1, sections: [] },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      renderGrid();

      expect(screen.getByText('No sections available')).toBeInTheDocument();
    });

    it('should display empty state when all sections are filtered out by roles', () => {
      // Create summary with only role-restricted sections
      const restrictedOnlySummary = {
        projectId: 1,
        sections: [
          createMockSectionSummary('quotation', { value: 15000000 }),
          createMockSectionSummary('finance', { value: 12000000 }),
        ],
      };
      mockUseProjectSummary.mockReturnValue({
        summary: restrictedOnlySummary,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });
      // User has no roles - quotation and finance sections filtered out
      mockHasAnyRole.mockReturnValue(false);

      renderGrid();

      expect(screen.getByText('No sections available')).toBeInTheDocument();
    });
  });

  describe('grid rendering', () => {
    it('should render all section cards when user has all roles', () => {
      mockUseProjectSummary.mockReturnValue({
        summary: createMockFullSummary(1),
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      renderGrid();

      expect(screen.getByText('견적')).toBeInTheDocument();
      expect(screen.getByText('공정/진행률')).toBeInTheDocument();
      expect(screen.getByText('외주')).toBeInTheDocument();
      expect(screen.getByText('납품')).toBeInTheDocument();
      expect(screen.getByText('도면/문서')).toBeInTheDocument();
      expect(screen.getByText('정산')).toBeInTheDocument();
    });

    it('should render all six section cards', () => {
      mockUseProjectSummary.mockReturnValue({
        summary: createMockFullSummary(1),
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      const { container } = renderGrid();

      // Each section renders a Card - we have 6 sections
      const grid = container.querySelector('.grid');
      expect(grid?.children.length).toBe(6);
    });

    it('should pass correct projectId to cards', async () => {
      const user = userEvent.setup();
      mockUseProjectSummary.mockReturnValue({
        summary: createMockFullSummary(42),
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      const { container } = renderGrid(42);

      // Click on first card and verify navigation includes projectId
      const grid = container.querySelector('.grid');
      const firstCard = grid?.firstChild as HTMLElement;
      await user.click(firstCard);

      expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('/projects/42/'));
    });
  });

  describe('role-based filtering', () => {
    it('should filter quotation section for users without required roles', () => {
      mockUseProjectSummary.mockReturnValue({
        summary: createMockFullSummary(1),
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });
      // User doesn't have quotation roles
      mockHasAnyRole.mockImplementation((roles: string[]) => {
        // Return false for quotation and finance roles
        if (roles.includes('ROLE_FINANCE')) return false;
        if (roles.includes('ROLE_SALES')) return false;
        return true;
      });

      renderGrid();

      // Quotation and finance should be hidden (they require ROLE_FINANCE or ROLE_SALES)
      expect(screen.queryByText('견적')).not.toBeInTheDocument();
      expect(screen.queryByText('정산')).not.toBeInTheDocument();

      // Other sections should be visible
      expect(screen.getByText('공정/진행률')).toBeInTheDocument();
      expect(screen.getByText('외주')).toBeInTheDocument();
      expect(screen.getByText('납품')).toBeInTheDocument();
      expect(screen.getByText('도면/문서')).toBeInTheDocument();
    });

    it('should call hasAnyRole with correct role requirements for quotation', () => {
      mockUseProjectSummary.mockReturnValue({
        summary: createMockFullSummary(1),
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      renderGrid();

      // Should have checked for quotation roles
      expect(mockHasAnyRole).toHaveBeenCalledWith(['ROLE_ADMIN', 'ROLE_FINANCE', 'ROLE_SALES']);
    });

    it('should call hasAnyRole with correct role requirements for finance', () => {
      mockUseProjectSummary.mockReturnValue({
        summary: createMockFullSummary(1),
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      renderGrid();

      // Should have checked for finance roles
      expect(mockHasAnyRole).toHaveBeenCalledWith(['ROLE_ADMIN', 'ROLE_FINANCE']);
    });

    it('should show sections without role requirements to all users', () => {
      mockUseProjectSummary.mockReturnValue({
        summary: createMockFullSummary(1),
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });
      // hasAnyRole always returns false
      mockHasAnyRole.mockReturnValue(false);

      renderGrid();

      // These sections have no role requirements
      // But quotation and finance should be hidden
      // Actually, looking at the code again:
      // - quotation: ['ROLE_ADMIN', 'ROLE_FINANCE', 'ROLE_SALES']
      // - finance: ['ROLE_ADMIN', 'ROLE_FINANCE']
      // - process, outsource, delivery, documents: no requirements

      // process, outsource, delivery, documents should still show
      expect(screen.getByText('공정/진행률')).toBeInTheDocument();
      expect(screen.getByText('외주')).toBeInTheDocument();
      expect(screen.getByText('납품')).toBeInTheDocument();
      expect(screen.getByText('도면/문서')).toBeInTheDocument();
    });
  });

  describe('hook usage', () => {
    it('should call useProjectSummary with correct projectId', () => {
      mockUseProjectSummary.mockReturnValue({
        summary: null,
        isLoading: true,
        error: null,
        refetch: mockRefetch,
      });

      renderGrid(123);

      expect(mockUseProjectSummary).toHaveBeenCalledWith({ projectId: 123 });
    });

    it('should update when projectId changes', () => {
      mockUseProjectSummary.mockReturnValue({
        summary: null,
        isLoading: true,
        error: null,
        refetch: mockRefetch,
      });

      const { rerender } = render(<ProjectRelatedNavigationGrid projectId={1} />);

      expect(mockUseProjectSummary).toHaveBeenCalledWith({ projectId: 1 });

      rerender(<ProjectRelatedNavigationGrid projectId={2} />);

      expect(mockUseProjectSummary).toHaveBeenCalledWith({ projectId: 2 });
    });
  });

  describe('grid layout', () => {
    it('should have responsive grid classes', () => {
      mockUseProjectSummary.mockReturnValue({
        summary: createMockFullSummary(1),
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      const { container } = renderGrid();

      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('grid-cols-1');
      expect(grid).toHaveClass('sm:grid-cols-2');
      expect(grid).toHaveClass('lg:grid-cols-3');
    });
  });
});
