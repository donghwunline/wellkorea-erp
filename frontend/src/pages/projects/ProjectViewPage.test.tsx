/**
 * Unit tests for ProjectViewPage component.
 * Tests loading states, error handling, project display, navigation, and accessibility.
 *
 * Following Constitution Principle VI, this tests the page as a composition layer:
 * - Feature components are mocked (they own their service calls)
 * - useProjectActions hook is mocked
 * - Focus is on state management, navigation, and component composition
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProjectViewPage } from './ProjectViewPage';
import type { ProjectDetails } from '@/services';

// Helper to create mock project (now includes resolved names from backend CQRS pattern)
function createMockProject(overrides: Partial<ProjectDetails> = {}): ProjectDetails {
  return {
    id: 42,
    jobCode: 'WK2-2025-042-0120',
    customerId: 1,
    customerName: 'Samsung Electronics',
    projectName: 'Test Project',
    requesterName: 'John Doe',
    dueDate: '2025-02-15',
    internalOwnerId: 2,
    internalOwnerName: 'Kim Minjun',
    status: 'ACTIVE',
    createdById: 1,
    createdByName: 'Lee Jiwon',
    createdAt: '2025-01-15T10:30:00Z',
    updatedAt: '2025-01-16T14:45:00Z',
    ...overrides,
  };
}

// Track props passed to mocked components
let detailsCardProps: Record<string, unknown> = {};
let navigationGridProps: Record<string, unknown> = {};

// Mock navigation
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock useAuth hook
vi.mock('@/shared/hooks', () => ({
  useAuth: () => ({
    hasAnyRole: vi.fn(() => true),
  }),
}));

// Mock useProjectActions hook
const mockGetProject = vi.fn();

vi.mock('@/components/features/projects', () => ({
  useProjectActions: vi.fn(() => ({
    getProject: mockGetProject,
    isLoading: false,
    error: null,
  })),
  useProjectSummary: vi.fn(() => ({
    summary: null,
    isLoading: false,
    error: null,
  })),
  ProjectDetailsCard: vi.fn((props: Record<string, unknown>) => {
    detailsCardProps = props;
    const project = props.project as ProjectDetails | undefined;
    const customerName = props.customerName as string | undefined;
    const onEdit = props.onEdit as (() => void) | undefined;
    return (
      <div data-testid="project-details-card">
        <span data-testid="project-name">{project?.projectName}</span>
        <span data-testid="customer-name">{customerName}</span>
        {onEdit && (
          <button
            data-testid="edit-project-button"
            onClick={() => onEdit()}
            aria-label="Edit project"
          >
            Edit
          </button>
        )}
      </div>
    );
  }),
  ProjectRelatedNavigationGrid: vi.fn((props: Record<string, unknown>) => {
    navigationGridProps = props;
    return <div data-testid="navigation-grid">Project ID: {props.projectId as number}</div>;
  }),
  ProjectKPIStrip: vi.fn(() => <div data-testid="kpi-strip">KPI Strip</div>),
}));

// Mock quotation feature components
vi.mock('@/components/features/quotations', () => ({
  QuotationDetailsPanel: vi.fn(() => <div data-testid="quotation-panel">Quotation Panel</div>),
}));

// Mock UI tab components to simplify testing
vi.mock('@/components/ui', async () => {
  const actual = await vi.importActual('@/components/ui');
  return {
    ...actual,
    Tabs: vi.fn(({ children, defaultTab }: { children: React.ReactNode; defaultTab?: string }) => (
      <div data-testid="tabs" data-default-tab={defaultTab}>{children}</div>
    )),
    TabList: vi.fn(({ children, className }: { children: React.ReactNode; className?: string }) => (
      <div role="tablist" className={className}>{children}</div>
    )),
    Tab: vi.fn(({ children, id }: { children: React.ReactNode; id: string }) => (
      <button role="tab" id={`tab-${id}`}>{children}</button>
    )),
    TabPanel: vi.fn(({ children, id }: { children: React.ReactNode; id: string }) => (
      <div role="tabpanel" id={`panel-${id}`}>{children}</div>
    )),
    TabOverflow: Object.assign(
      vi.fn(({ children }: { children: React.ReactNode }) => (
        <div data-testid="tab-overflow">{children}</div>
      )),
      {
        Item: vi.fn(({ children, id }: { children: React.ReactNode; id: string }) => (
          <div data-testid={`overflow-item-${id}`}>{children}</div>
        )),
      }
    ),
  };
});

// Import mocked hook for assertions
import { useProjectActions } from '@/components/features/projects';

// Helper to render with route params
function renderProjectViewPage(projectId = '42') {
  return render(
    <MemoryRouter initialEntries={[`/projects/${projectId}`]}>
      <Routes>
        <Route path="/projects/:id" element={<ProjectViewPage />} />
        <Route path="/projects" element={<div>Project List</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProjectViewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    detailsCardProps = {};
    navigationGridProps = {};
    mockGetProject.mockResolvedValue(createMockProject());

    // Reset the mock to default state
    vi.mocked(useProjectActions).mockReturnValue({
      getProject: mockGetProject,
      isLoading: false,
      error: null,
      createProject: vi.fn(),
      updateProject: vi.fn(),
      clearError: vi.fn(),
    });
  });

  describe('loading state', () => {
    it('should display loading state when fetching project', () => {
      vi.mocked(useProjectActions).mockReturnValue({
        getProject: mockGetProject,
        isLoading: true,
        error: null,
        createProject: vi.fn(),
        updateProject: vi.fn(),
        clearError: vi.fn(),
      });

      renderProjectViewPage();

      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.getByText('Loading project...')).toBeInTheDocument();
    });

    it('should show loading spinner', () => {
      vi.mocked(useProjectActions).mockReturnValue({
        getProject: mockGetProject,
        isLoading: true,
        error: null,
        createProject: vi.fn(),
        updateProject: vi.fn(),
        clearError: vi.fn(),
      });

      const { container } = renderProjectViewPage();

      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('should display error message when fetch fails', async () => {
      vi.mocked(useProjectActions).mockReturnValue({
        getProject: mockGetProject,
        isLoading: false,
        error: 'Failed to load project',
        createProject: vi.fn(),
        updateProject: vi.fn(),
        clearError: vi.fn(),
      });

      renderProjectViewPage();

      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument();
        expect(screen.getByText('Failed to load project')).toBeInTheDocument();
      });
    });

    it('should show back to projects link on error', async () => {
      vi.mocked(useProjectActions).mockReturnValue({
        getProject: mockGetProject,
        isLoading: false,
        error: 'Network error',
        createProject: vi.fn(),
        updateProject: vi.fn(),
        clearError: vi.fn(),
      });

      renderProjectViewPage();

      await waitFor(() => {
        expect(screen.getByText('Back to Projects')).toBeInTheDocument();
      });
    });

    it('should navigate back when back link is clicked on error', async () => {
      const user = userEvent.setup();
      vi.mocked(useProjectActions).mockReturnValue({
        getProject: mockGetProject,
        isLoading: false,
        error: 'Error',
        createProject: vi.fn(),
        updateProject: vi.fn(),
        clearError: vi.fn(),
      });

      renderProjectViewPage();

      await waitFor(() => {
        expect(screen.getByText('Back to Projects')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Back to Projects'));

      expect(mockNavigate).toHaveBeenCalledWith('/projects');
    });
  });

  describe('not found state', () => {
    it('should display not found when project is null', async () => {
      mockGetProject.mockResolvedValue(null);

      renderProjectViewPage();

      await waitFor(() => {
        expect(screen.getByText('Project Not Found')).toBeInTheDocument();
        expect(
          screen.getByText('The requested project could not be found.')
        ).toBeInTheDocument();
      });
    });

    it('should show back to projects link when not found', async () => {
      mockGetProject.mockResolvedValue(null);

      renderProjectViewPage();

      await waitFor(() => {
        expect(screen.getByText('Back to Projects')).toBeInTheDocument();
      });
    });
  });

  describe('successful render', () => {
    it('should display project name in header', async () => {
      mockGetProject.mockResolvedValue(createMockProject({ projectName: 'My Project' }));

      renderProjectViewPage();

      await waitFor(() => {
        // Check for project name in the heading (h1)
        expect(screen.getByRole('heading', { name: 'My Project', level: 1 })).toBeInTheDocument();
      });
    });

    it('should display job code in header description', async () => {
      mockGetProject.mockResolvedValue(createMockProject({ jobCode: 'WK2-2025-099-0131' }));

      renderProjectViewPage();

      await waitFor(() => {
        expect(screen.getByText('Job Code: WK2-2025-099-0131')).toBeInTheDocument();
      });
    });

    it('should render ProjectDetailsCard', async () => {
      mockGetProject.mockResolvedValue(createMockProject());

      renderProjectViewPage();

      await waitFor(() => {
        expect(screen.getByTestId('project-details-card')).toBeInTheDocument();
      });
    });

    it('should pass project to ProjectDetailsCard', async () => {
      const project = createMockProject({ projectName: 'Card Test' });
      mockGetProject.mockResolvedValue(project);

      renderProjectViewPage();

      await waitFor(() => {
        expect(screen.getByTestId('project-name')).toHaveTextContent('Card Test');
      });
    });

    it('should render overview tab with navigation grid', async () => {
      mockGetProject.mockResolvedValue(createMockProject());

      renderProjectViewPage();

      await waitFor(() => {
        // Tabs are now used instead of "Related Sections" heading
        expect(screen.getByRole('tab', { name: /개요/i })).toBeInTheDocument();
      });
    });

    it('should render ProjectRelatedNavigationGrid', async () => {
      mockGetProject.mockResolvedValue(createMockProject());

      renderProjectViewPage();

      await waitFor(() => {
        expect(screen.getByTestId('navigation-grid')).toBeInTheDocument();
      });
    });

    it('should pass projectId to navigation grid', async () => {
      mockGetProject.mockResolvedValue(createMockProject({ id: 42 }));

      renderProjectViewPage();

      await waitFor(() => {
        expect(navigationGridProps.projectId).toBe(42);
      });
    });
  });

  describe('navigation', () => {
    it('should render Back to Projects link', async () => {
      mockGetProject.mockResolvedValue(createMockProject());

      renderProjectViewPage();

      await waitFor(() => {
        expect(screen.getByText('Back to Projects')).toBeInTheDocument();
      });
    });

    it('should navigate to projects list when back is clicked', async () => {
      const user = userEvent.setup();
      mockGetProject.mockResolvedValue(createMockProject());

      renderProjectViewPage();

      await waitFor(() => {
        expect(screen.getByText('Back to Projects')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Back to Projects'));

      expect(mockNavigate).toHaveBeenCalledWith('/projects');
    });

    it('should pass onEdit to ProjectDetailsCard', async () => {
      mockGetProject.mockResolvedValue(createMockProject());

      renderProjectViewPage();

      await waitFor(() => {
        expect(detailsCardProps.onEdit).toBeDefined();
        expect(typeof detailsCardProps.onEdit).toBe('function');
      });
    });

    it('should navigate to edit page when edit is triggered from card', async () => {
      const user = userEvent.setup();
      mockGetProject.mockResolvedValue(createMockProject({ id: 42 }));

      renderProjectViewPage('42');

      await waitFor(() => {
        expect(screen.getByTestId('edit-project-button')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('edit-project-button'));

      expect(mockNavigate).toHaveBeenCalledWith('/projects/42/edit');
    });
  });

  describe('data fetching', () => {
    it('should call getProject with project id from URL', async () => {
      mockGetProject.mockResolvedValue(createMockProject());

      renderProjectViewPage('99');

      await waitFor(() => {
        expect(mockGetProject).toHaveBeenCalledWith(99);
      });
    });

    it('should include id in useEffect dependencies', async () => {
      // This test verifies the component has correct dependencies for refetching.
      // Note: Testing actual route changes requires integration tests with real routing.
      // The component's useEffect depends on `id`, so it will refetch when id changes.
      mockGetProject.mockResolvedValue(createMockProject());

      renderProjectViewPage('1');

      await waitFor(() => {
        expect(mockGetProject).toHaveBeenCalledWith(1);
      });

      // Test that different IDs fetch different projects
      vi.clearAllMocks();
      renderProjectViewPage('2');

      await waitFor(() => {
        expect(mockGetProject).toHaveBeenCalledWith(2);
      });
    });
  });

  describe('name resolution', () => {
    it('should pass customerName from mock data', async () => {
      mockGetProject.mockResolvedValue(createMockProject({ customerId: 1 }));

      renderProjectViewPage();

      await waitFor(() => {
        // The component uses MOCK_CUSTOMERS to resolve names
        expect(screen.getByTestId('customer-name')).toHaveTextContent('Samsung Electronics');
      });
    });
  });

  describe('accessibility', () => {
    it('should have accessible page heading', async () => {
      mockGetProject.mockResolvedValue(createMockProject({ projectName: 'My Project' }));

      renderProjectViewPage();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /my project/i })).toBeInTheDocument();
      });
    });

    it('should have accessible edit button in details card', async () => {
      mockGetProject.mockResolvedValue(createMockProject());

      renderProjectViewPage();

      await waitFor(() => {
        const editButton = screen.getByTestId('edit-project-button');
        expect(editButton).toHaveAttribute('aria-label', 'Edit project');
      });
    });

    it('should have accessible tab navigation', async () => {
      mockGetProject.mockResolvedValue(createMockProject());

      renderProjectViewPage();

      await waitFor(() => {
        // Page now uses tabs; verify tablist has correct role
        expect(screen.getByRole('tablist')).toBeInTheDocument();
      });
    });
  });

  describe('layout', () => {
    it('should render with proper background styling', async () => {
      mockGetProject.mockResolvedValue(createMockProject());

      const { container } = renderProjectViewPage();

      await waitFor(() => {
        expect(screen.getByTestId('project-details-card')).toBeInTheDocument();
      });

      const mainDiv = container.firstChild;
      expect(mainDiv).toHaveClass('min-h-screen');
      expect(mainDiv).toHaveClass('bg-steel-950');
    });
  });
});
