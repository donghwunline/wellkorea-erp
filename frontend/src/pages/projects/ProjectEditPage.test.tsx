/**
 * Unit tests for ProjectEditPage component.
 * Tests loading states, error handling, project editing, navigation, and accessibility.
 *
 * Following Constitution Principle VI, this tests the page as a composition layer:
 * - Feature components are mocked (they own their service calls)
 * - Query Factory and mutation hooks are mocked
 * - Focus is on state management, navigation, and component composition
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProjectEditPage } from './ProjectEditPage';
import type {
  CreateProjectInput,
  Project,
  ProjectCommandResult,
  UpdateProjectInput,
} from '@/entities/project';

// Default mock project details for getProject
const DEFAULT_PROJECT: Project = {
  id: 42,
  jobCode: 'WK2-2025-042-0120',
  customerId: 1,
  customerName: 'Test Customer',
  projectName: 'Test Project',
  requesterName: 'John Doe',
  dueDate: '2025-02-15',
  internalOwnerId: 2,
  internalOwnerName: 'Test Owner',
  status: 'ACTIVE',
  createdById: 1,
  createdByName: 'Test Creator',
  createdAt: '2025-01-15T10:30:00Z',
  updatedAt: '2025-01-16T14:45:00Z',
};

// Default mock command result for updateProject
const DEFAULT_UPDATE_RESULT: ProjectCommandResult = {
  id: 42,
  message: 'Project updated successfully',
  jobCode: null,
};

// Mock response state - will be set per test
let mockProjectData: Project | null = null;
let mockShouldError = false;

// Mock project queries
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
    },
  };
});

// Track props passed to mocked components
let formProps: Record<string, unknown> = {};

// Mock navigation
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock mutateAsync for the update hook
const mockMutateAsync = vi.fn();
const mockClearError = vi.fn();

// Mock useUpdateProject hook from features
vi.mock('@/features/project', () => ({
  useUpdateProject: vi.fn(() => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  })),
}));

vi.mock('@/components/features/projects', () => ({
  ProjectForm: vi.fn((props: Record<string, unknown>) => {
    formProps = props;
    return (
      <div data-testid="project-form">
        <span data-testid="form-mode">{props.mode as string}</span>
        <span data-testid="form-initial-name">
          {(props.initialData as Project)?.projectName}
        </span>
        <button
          data-testid="form-submit"
          onClick={() =>
            (props.onSubmit as (data: CreateProjectInput | UpdateProjectInput) => Promise<void>)({
              projectName: 'Updated Project',
              dueDate: '2025-03-01',
            })
          }
        >
          Submit
        </button>
        <button data-testid="form-cancel" onClick={() => (props.onCancel as () => void)()}>
          Cancel
        </button>
      </div>
    );
  }),
  SelectOption: {},
}));

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
function renderProjectEditPage(projectId = '42') {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/projects/${projectId}/edit`]}>
        <Routes>
          <Route path="/projects/:id/edit" element={<ProjectEditPage />} />
          <Route path="/projects/:id" element={<div>Project View</div>} />
          <Route path="/projects" element={<div>Project List</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('ProjectEditPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    formProps = {};
    mockProjectData = DEFAULT_PROJECT;
    mockShouldError = false;
    mockMutateAsync.mockResolvedValue(DEFAULT_UPDATE_RESULT);
  });

  describe('loading state', () => {
    it('should display loading state initially', async () => {
      // Set project to null initially to simulate loading
      mockProjectData = null;

      renderProjectEditPage();

      // Initially shows loading
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('should display error message when fetch fails', async () => {
      mockShouldError = true;

      renderProjectEditPage();

      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument();
        expect(screen.getByText('Failed to load project')).toBeInTheDocument();
      });
    });

    it('should show back to projects link on error', async () => {
      mockShouldError = true;

      renderProjectEditPage();

      await waitFor(() => {
        expect(screen.getByText('Back to Projects')).toBeInTheDocument();
      });
    });

    it('should navigate back when back link is clicked on error', async () => {
      const user = userEvent.setup();
      mockShouldError = true;

      renderProjectEditPage();

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

      renderProjectEditPage();

      await waitFor(() => {
        expect(screen.getByText('Project Not Found')).toBeInTheDocument();
        expect(screen.getByText('The requested project could not be found.')).toBeInTheDocument();
      });
    });

    it('should show back to projects link when not found', async () => {
      mockProjectData = null;

      renderProjectEditPage();

      await waitFor(() => {
        expect(screen.getByText('Back to Projects')).toBeInTheDocument();
      });
    });

    it('should navigate back when back link is clicked on not found', async () => {
      const user = userEvent.setup();
      mockProjectData = null;

      renderProjectEditPage();

      await waitFor(() => {
        expect(screen.getByText('Back to Projects')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Back to Projects'));

      expect(mockNavigate).toHaveBeenCalledWith('/projects');
    });
  });

  describe('successful render', () => {
    it('should display Edit Project header', async () => {
      mockProjectData = DEFAULT_PROJECT;

      renderProjectEditPage();

      await waitFor(() => {
        expect(screen.getByText('Edit Project')).toBeInTheDocument();
      });
    });

    it('should display job code in header description', async () => {
      mockProjectData = { ...DEFAULT_PROJECT, jobCode: 'WK2-2025-099-0131' };

      renderProjectEditPage();

      await waitFor(() => {
        expect(screen.getByText('Job Code: WK2-2025-099-0131')).toBeInTheDocument();
      });
    });

    it('should render Edit Project Details heading', async () => {
      mockProjectData = DEFAULT_PROJECT;

      renderProjectEditPage();

      await waitFor(() => {
        expect(screen.getByText('Edit Project Details')).toBeInTheDocument();
      });
    });

    it('should render ProjectForm', async () => {
      mockProjectData = DEFAULT_PROJECT;

      renderProjectEditPage();

      await waitFor(() => {
        expect(screen.getByTestId('project-form')).toBeInTheDocument();
      });
    });

    it('should render Back to Project link', async () => {
      mockProjectData = DEFAULT_PROJECT;

      renderProjectEditPage();

      await waitFor(() => {
        expect(screen.getByText('Back to Project')).toBeInTheDocument();
      });
    });
  });

  describe('form props', () => {
    it('should pass mode="edit" to form', async () => {
      mockProjectData = DEFAULT_PROJECT;

      renderProjectEditPage();

      await waitFor(() => {
        expect(screen.getByTestId('form-mode')).toHaveTextContent('edit');
      });
    });

    it('should pass initialData to form', async () => {
      mockProjectData = { ...DEFAULT_PROJECT, projectName: 'My Existing Project' };

      renderProjectEditPage();

      await waitFor(() => {
        expect(screen.getByTestId('form-initial-name')).toHaveTextContent('My Existing Project');
      });
    });

    it('should pass isSubmitting from hook', async () => {
      mockProjectData = DEFAULT_PROJECT;

      renderProjectEditPage();

      await waitFor(() => {
        expect(formProps.isSubmitting).toBe(false);
      });
    });
  });

  describe('form submission', () => {
    it('should call mutateAsync when form is submitted', async () => {
      const user = userEvent.setup();
      mockProjectData = DEFAULT_PROJECT;

      renderProjectEditPage('42');

      await waitFor(() => {
        expect(screen.getByTestId('project-form')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('form-submit'));

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          id: 42,
          input: {
            projectName: 'Updated Project',
            dueDate: '2025-03-01',
          },
        });
      });
    });

    it('should navigate to project view after successful update', async () => {
      const user = userEvent.setup();
      mockProjectData = DEFAULT_PROJECT;

      renderProjectEditPage('42');

      await waitFor(() => {
        expect(screen.getByTestId('project-form')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('form-submit'));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/projects/42');
      });
    });

    it('should not navigate when update fails', async () => {
      const user = userEvent.setup();
      mockProjectData = DEFAULT_PROJECT;
      mockMutateAsync.mockRejectedValue(new Error('Update failed'));

      renderProjectEditPage('42');

      await waitFor(() => {
        expect(screen.getByTestId('project-form')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('form-submit'));

      // Wait a bit for any async operations
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should not have navigated
      expect(mockNavigate).not.toHaveBeenCalledWith('/projects/42');
    });
  });

  describe('navigation', () => {
    it('should navigate to project view when Back to Project is clicked', async () => {
      const user = userEvent.setup();
      mockProjectData = DEFAULT_PROJECT;

      renderProjectEditPage('42');

      await waitFor(() => {
        expect(screen.getByText('Back to Project')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Back to Project'));

      expect(mockNavigate).toHaveBeenCalledWith('/projects/42');
    });

    it('should navigate to project view when form cancel is clicked', async () => {
      const user = userEvent.setup();
      mockProjectData = DEFAULT_PROJECT;

      renderProjectEditPage('42');

      await waitFor(() => {
        expect(screen.getByTestId('form-cancel')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('form-cancel'));

      expect(mockNavigate).toHaveBeenCalledWith('/projects/42');
    });
  });

  describe('accessibility', () => {
    it('should have accessible page heading', async () => {
      mockProjectData = DEFAULT_PROJECT;

      renderProjectEditPage();

      await waitFor(() => {
        // Use level: 1 to specifically get the h1 "Edit Project" not the h2 "Edit Project Details"
        expect(screen.getByRole('heading', { name: 'Edit Project', level: 1 })).toBeInTheDocument();
      });
    });

    it('should have accessible section heading', async () => {
      mockProjectData = DEFAULT_PROJECT;

      renderProjectEditPage();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /edit project details/i })).toBeInTheDocument();
      });
    });
  });

  describe('layout', () => {
    it('should render with proper background styling', async () => {
      mockProjectData = DEFAULT_PROJECT;

      const { container } = renderProjectEditPage();

      await waitFor(() => {
        expect(screen.getByTestId('project-form')).toBeInTheDocument();
      });

      const mainDiv = container.firstChild;
      expect(mainDiv).toHaveClass('min-h-screen');
      expect(mainDiv).toHaveClass('bg-steel-950');
    });

    it('should render form in a Card', async () => {
      mockProjectData = DEFAULT_PROJECT;

      const { container } = renderProjectEditPage();

      await waitFor(() => {
        expect(screen.getByTestId('project-form')).toBeInTheDocument();
      });

      const card = container.querySelector('.rounded-xl');
      expect(card).toBeInTheDocument();
    });
  });
});
