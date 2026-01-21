/**
 * Unit tests for ProjectViewPage component.
 * Tests loading states, error handling, project display, navigation, and accessibility.
 *
 * Following Constitution Principle VI, this tests the page as a composition layer:
 * - Feature components are mocked (they own their service calls)
 * - Query Factory is mocked via projectQueries
 * - Focus is on state management, navigation, and component composition
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProjectViewPage } from './ProjectViewPage';
import type { Project } from '@/entities/project';

// Mock response state - will be set per test
let mockProjectData: Project | null = null;
let mockShouldError = false;

// Mock project queries and entity components
vi.mock('@/entities/project', async () => {
  const actual = await vi.importActual('@/entities/project');
  return {
    ...actual,
    projectQueries: {
      detail: (id: number) => ({
        queryKey: ['projects', 'detail', id],
        queryFn: async () => {
          if (mockShouldError) throw new Error('Failed to load project');
          return mockProjectData;
        },
        enabled: id > 0,
      }),
      kpi: (id: number) => ({
        queryKey: ['projects', 'kpi', id],
        queryFn: async () => ({
          totalItems: 10,
          completedItems: 5,
          progressPercent: 50,
        }),
        enabled: id > 0,
      }),
      summary: (id: number) => ({
        queryKey: ['projects', 'summary', id],
        queryFn: async () => ({
          sections: [],
        }),
        enabled: id > 0,
      }),
    },
    ProjectDetailsCard: vi.fn((props: Record<string, unknown>) => {
      detailsCardProps = props;
      const project = props.project as Project | undefined;
      const onEdit = props.onEdit as (() => void) | undefined;
      return (
        <div data-testid="project-details-card">
          <span data-testid="project-name">{project?.projectName}</span>
          <span data-testid="customer-name">{project?.customerName}</span>
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
    ProjectKPIStrip: vi.fn(() => <div data-testid="kpi-strip">KPI Strip</div>),
    ProjectKPIStripSkeleton: vi.fn(() => <div data-testid="kpi-strip-skeleton">Loading KPI...</div>),
  };
});

// Helper to create mock project (now includes resolved names from backend CQRS pattern)
function createMockProject(overrides: Partial<Project> = {}): Project {
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
    note: null,
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
vi.mock('@/entities/auth', async () => {
  const actual = await vi.importActual('@/entities/auth');
  return {
    ...actual,
    useAuth: () => ({
      hasAnyRole: vi.fn(() => true),
    }),
  };
});

// Mock widgets
vi.mock('@/widgets', () => ({
  QuotationPanel: vi.fn(() => <div data-testid="quotation-panel">Quotation Panel</div>),
  ProjectRelatedNavigationGrid: vi.fn((props: Record<string, unknown>) => {
    navigationGridProps = props;
    return <div data-testid="navigation-grid">Project ID: {props.projectId as number}</div>;
  }),
  TaskFlowModal: vi.fn(() => null),
  TaskFlowPanel: vi.fn(() => <div data-testid="task-flow-panel">Task Flow Panel</div>),
  DeliveryPanel: vi.fn(() => <div data-testid="delivery-panel">Delivery Panel</div>),
  InvoicePanel: vi.fn(() => <div data-testid="invoice-panel">Invoice Panel</div>),
  PurchasePanel: vi.fn(() => <div data-testid="purchase-panel">Purchase Panel</div>),
  OutsourcePanel: vi.fn(() => <div data-testid="outsource-panel">Outsource Panel</div>),
  DocumentPanel: vi.fn(() => <div data-testid="document-panel">Document Panel</div>),
}));

// Mock UI tab components to simplify testing
vi.mock('@/shared/ui', async () => {
  const actual = await vi.importActual('@/shared/ui');

  // PageHeader compound component mock
  const PageHeaderMock = Object.assign(
    vi.fn(({ children }: { children: React.ReactNode }) => (
      <header data-testid="page-header">{children}</header>
    )),
    {
      Title: vi.fn(({ title, description }: { title: string; description?: string }) => (
        <div>
          <h1>{title}</h1>
          {description && <p>{description}</p>}
        </div>
      )),
      Actions: vi.fn(({ children }: { children: React.ReactNode }) => (
        <div data-testid="page-header-actions">{children}</div>
      )),
    }
  );

  return {
    ...actual,
    PageHeader: PageHeaderMock,
    Alert: vi.fn(({ children, variant }: { children: React.ReactNode; variant?: string; className?: string }) => (
      <div data-testid="alert" data-variant={variant}>{children}</div>
    )),
    Card: vi.fn(({ children, className }: { children: React.ReactNode; className?: string }) => (
      <div data-testid="card" className={className}>{children}</div>
    )),
    Icon: vi.fn(({ name, className }: { name: string; className?: string }) => (
      <span data-testid={`icon-${name}`} className={className} />
    )),
    Spinner: vi.fn(({ size, label }: { size?: string; label?: string }) => (
      <div data-testid="spinner" data-size={size}>{label}</div>
    )),
    Tabs: vi.fn(({ children, defaultTab }: { children: React.ReactNode; defaultTab?: string }) => (
      <div data-testid="tabs" data-default-tab={defaultTab}>
        {children}
      </div>
    )),
    TabList: vi.fn(({ children, className }: { children: React.ReactNode; className?: string }) => (
      <div role="tablist" className={className}>
        {children}
      </div>
    )),
    Tab: vi.fn(({ children, id }: { children: React.ReactNode; id: string }) => (
      <button role="tab" id={`tab-${id}`}>
        {children}
      </button>
    )),
    TabPanel: vi.fn(({ children, id }: { children: React.ReactNode; id: string }) => (
      <div role="tabpanel" id={`panel-${id}`}>
        {children}
      </div>
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

// Helper to create test query client
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
}

// Helper to render with route params and QueryClientProvider
function renderProjectViewPage(projectId = '42') {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/projects/${projectId}`]}>
        <Routes>
          <Route path="/projects/:id" element={<ProjectViewPage />} />
          <Route path="/projects" element={<div>Project List</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('ProjectViewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    detailsCardProps = {};
    navigationGridProps = {};
    // Reset mock state
    mockProjectData = createMockProject();
    mockShouldError = false;
  });

  describe('loading state', () => {
    it('should display loading state initially', async () => {
      // Set project to null initially to simulate loading
      mockProjectData = null;

      renderProjectViewPage();

      // Initially shows loading
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('should display error message when fetch fails', async () => {
      mockShouldError = true;

      renderProjectViewPage();

      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument();
        expect(screen.getByText('Failed to load project')).toBeInTheDocument();
      });
    });

    it('should show back to projects link on error', async () => {
      mockShouldError = true;

      renderProjectViewPage();

      await waitFor(() => {
        expect(screen.getByText('Back to Projects')).toBeInTheDocument();
      });
    });

    it('should navigate back when back link is clicked on error', async () => {
      const user = userEvent.setup();
      mockShouldError = true;

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
      mockProjectData = null;

      renderProjectViewPage();

      await waitFor(() => {
        expect(screen.getByText('Project Not Found')).toBeInTheDocument();
        expect(screen.getByText('The requested project could not be found.')).toBeInTheDocument();
      });
    });

    it('should show back to projects link when not found', async () => {
      mockProjectData = null;

      renderProjectViewPage();

      await waitFor(() => {
        expect(screen.getByText('Back to Projects')).toBeInTheDocument();
      });
    });
  });

  describe('successful render', () => {
    it('should display project name in header', async () => {
      mockProjectData = createMockProject({ projectName: 'My Project' });

      renderProjectViewPage();

      await waitFor(() => {
        // Check for project name in the heading (h1)
        expect(screen.getByRole('heading', { name: 'My Project', level: 1 })).toBeInTheDocument();
      });
    });

    it('should display job code in header description', async () => {
      mockProjectData = createMockProject({ jobCode: 'WK2-2025-099-0131' });

      renderProjectViewPage();

      await waitFor(() => {
        expect(screen.getByText('Job Code: WK2-2025-099-0131')).toBeInTheDocument();
      });
    });

    it('should render ProjectDetailsCard', async () => {
      mockProjectData = createMockProject();

      renderProjectViewPage();

      await waitFor(() => {
        expect(screen.getByTestId('project-details-card')).toBeInTheDocument();
      });
    });

    it('should pass project to ProjectDetailsCard', async () => {
      mockProjectData = createMockProject({ projectName: 'Card Test' });

      renderProjectViewPage();

      await waitFor(() => {
        expect(screen.getByTestId('project-name')).toHaveTextContent('Card Test');
      });
    });

    // TODO: Re-enable when ProjectRelatedNavigationGrid is uncommented in ProjectViewPage.tsx
    it.skip('should render overview tab with navigation grid', async () => {
      mockProjectData = createMockProject();

      renderProjectViewPage();

      await waitFor(() => {
        // Tabs are now used instead of "Related Sections" heading
        expect(screen.getByRole('tab', { name: /개요/i })).toBeInTheDocument();
      });
    });

    // TODO: Re-enable when ProjectRelatedNavigationGrid is uncommented in ProjectViewPage.tsx
    it.skip('should render ProjectRelatedNavigationGrid', async () => {
      mockProjectData = createMockProject();

      renderProjectViewPage();

      await waitFor(() => {
        expect(screen.getByTestId('navigation-grid')).toBeInTheDocument();
      });
    });

    // TODO: Re-enable when ProjectRelatedNavigationGrid is uncommented in ProjectViewPage.tsx
    it.skip('should pass projectId to navigation grid', async () => {
      mockProjectData = createMockProject({ id: 42 });

      renderProjectViewPage();

      await waitFor(() => {
        expect(navigationGridProps.projectId).toBe(42);
      });
    });
  });

  describe('navigation', () => {
    it('should render Back to Projects link', async () => {
      mockProjectData = createMockProject();

      renderProjectViewPage();

      await waitFor(() => {
        expect(screen.getByText('Back to Projects')).toBeInTheDocument();
      });
    });

    it('should navigate to projects list when back is clicked', async () => {
      const user = userEvent.setup();
      mockProjectData = createMockProject();

      renderProjectViewPage();

      await waitFor(() => {
        expect(screen.getByText('Back to Projects')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Back to Projects'));

      expect(mockNavigate).toHaveBeenCalledWith('/projects');
    });

    it('should pass onEdit to ProjectDetailsCard', async () => {
      mockProjectData = createMockProject();

      renderProjectViewPage();

      await waitFor(() => {
        expect(detailsCardProps.onEdit).toBeDefined();
        expect(typeof detailsCardProps.onEdit).toBe('function');
      });
    });

    it('should navigate to edit page when edit is triggered from card', async () => {
      const user = userEvent.setup();
      mockProjectData = createMockProject({ id: 42 });

      renderProjectViewPage('42');

      await waitFor(() => {
        expect(screen.getByTestId('edit-project-button')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('edit-project-button'));

      expect(mockNavigate).toHaveBeenCalledWith('/projects/42/edit');
    });
  });

  describe('name resolution', () => {
    it('should pass customerName from project data', async () => {
      mockProjectData = createMockProject({ customerName: 'Samsung Electronics' });

      renderProjectViewPage();

      await waitFor(() => {
        // The component passes customerName to ProjectDetailsCard
        expect(screen.getByTestId('customer-name')).toHaveTextContent('Samsung Electronics');
      });
    });
  });

  describe('accessibility', () => {
    it('should have accessible page heading', async () => {
      mockProjectData = createMockProject({ projectName: 'My Project' });

      renderProjectViewPage();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /my project/i })).toBeInTheDocument();
      });
    });

    it('should have accessible edit button in details card', async () => {
      mockProjectData = createMockProject();

      renderProjectViewPage();

      await waitFor(() => {
        const editButton = screen.getByTestId('edit-project-button');
        expect(editButton).toHaveAttribute('aria-label', 'Edit project');
      });
    });

    it('should have accessible tab navigation', async () => {
      mockProjectData = createMockProject();

      renderProjectViewPage();

      await waitFor(() => {
        // Page now uses tabs; verify tablist has correct role
        expect(screen.getByRole('tablist')).toBeInTheDocument();
      });
    });
  });

  describe('layout', () => {
    it('should render with proper background styling', async () => {
      mockProjectData = createMockProject();

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
