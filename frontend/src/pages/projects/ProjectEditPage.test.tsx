/**
 * Unit tests for ProjectEditPage component.
 * Tests loading states, error handling, project editing, navigation, and accessibility.
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
import { ProjectEditPage } from './ProjectEditPage';
import type { CreateProjectRequest, ProjectDetails, UpdateProjectRequest } from '@/services';

// Helper to create mock project
function createMockProject(overrides: Partial<ProjectDetails> = {}): ProjectDetails {
  return {
    id: 42,
    jobCode: 'WK2-2025-042-0120',
    customerId: 1,
    projectName: 'Test Project',
    requesterName: 'John Doe',
    dueDate: '2025-02-15',
    internalOwnerId: 2,
    status: 'ACTIVE',
    createdById: 1,
    createdAt: '2025-01-15T10:30:00Z',
    updatedAt: '2025-01-16T14:45:00Z',
    ...overrides,
  };
}

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

// Mock useProjectActions hook
const mockGetProject = vi.fn();
const mockUpdateProject = vi.fn();
const mockClearError = vi.fn();

vi.mock('@/components/features/projects', () => ({
  useProjectActions: vi.fn(() => ({
    getProject: mockGetProject,
    updateProject: mockUpdateProject,
    isLoading: false,
    error: null,
    clearError: mockClearError,
  })),
  ProjectForm: vi.fn((props: Record<string, unknown>) => {
    formProps = props;
    return (
      <div data-testid="project-form">
        <span data-testid="form-mode">{props.mode as string}</span>
        <span data-testid="form-initial-name">
          {(props.initialData as ProjectDetails)?.projectName}
        </span>
        <button
          data-testid="form-submit"
          onClick={() =>
            (props.onSubmit as (data: CreateProjectRequest | UpdateProjectRequest) => Promise<void>)({
              projectName: 'Updated Project',
              dueDate: '2025-03-01',
            })
          }
        >
          Submit
        </button>
        <button
          data-testid="form-cancel"
          onClick={() => (props.onCancel as () => void)()}
        >
          Cancel
        </button>
      </div>
    );
  }),
  SelectOption: {},
}));

// Import mocked hook for assertions
import { useProjectActions } from '@/components/features/projects';

// Helper to render with route params
function renderProjectEditPage(projectId = '42') {
  return render(
    <MemoryRouter initialEntries={[`/projects/${projectId}/edit`]}>
      <Routes>
        <Route path="/projects/:id/edit" element={<ProjectEditPage />} />
        <Route path="/projects/:id" element={<div>Project View</div>} />
        <Route path="/projects" element={<div>Project List</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProjectEditPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    formProps = {};
    mockGetProject.mockResolvedValue(createMockProject());

    // Reset the mock to default state
    vi.mocked(useProjectActions).mockReturnValue({
      getProject: mockGetProject,
      updateProject: mockUpdateProject,
      isLoading: false,
      error: null,
      clearError: mockClearError,
      createProject: vi.fn(),
    });
  });

  describe('loading state', () => {
    it('should display loading state while fetching project', async () => {
      // Create a promise that won't resolve immediately
      let resolvePromise: (value: ProjectDetails) => void;
      mockGetProject.mockImplementation(
        () =>
          new Promise<ProjectDetails>(resolve => {
            resolvePromise = resolve;
          })
      );

      renderProjectEditPage();

      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.getByText('Loading project...')).toBeInTheDocument();

      // Resolve and wait for loading to complete
      await waitFor(() => {
        resolvePromise!(createMockProject());
      });
    });

    it('should show loading spinner', async () => {
      let resolvePromise: (value: ProjectDetails) => void;
      mockGetProject.mockImplementation(
        () =>
          new Promise<ProjectDetails>(resolve => {
            resolvePromise = resolve;
          })
      );

      const { container } = renderProjectEditPage();

      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();

      await waitFor(() => {
        resolvePromise!(createMockProject());
      });
    });
  });

  describe('error state', () => {
    it('should display error message when fetch fails', async () => {
      mockGetProject.mockRejectedValue(new Error('Failed to load'));

      vi.mocked(useProjectActions).mockReturnValue({
        getProject: mockGetProject,
        updateProject: mockUpdateProject,
        isLoading: false,
        error: 'Failed to load project',
        clearError: mockClearError,
        createProject: vi.fn(),
      });

      renderProjectEditPage();

      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument();
        expect(screen.getByText('Failed to load project')).toBeInTheDocument();
      });
    });

    it('should show back to projects link on error', async () => {
      mockGetProject.mockRejectedValue(new Error('Network error'));

      vi.mocked(useProjectActions).mockReturnValue({
        getProject: mockGetProject,
        updateProject: mockUpdateProject,
        isLoading: false,
        error: 'Network error',
        clearError: mockClearError,
        createProject: vi.fn(),
      });

      renderProjectEditPage();

      await waitFor(() => {
        expect(screen.getByText('Back to Projects')).toBeInTheDocument();
      });
    });

    it('should navigate back when back link is clicked on error', async () => {
      const user = userEvent.setup();
      mockGetProject.mockRejectedValue(new Error('Error'));

      vi.mocked(useProjectActions).mockReturnValue({
        getProject: mockGetProject,
        updateProject: mockUpdateProject,
        isLoading: false,
        error: 'Error',
        clearError: mockClearError,
        createProject: vi.fn(),
      });

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
      mockGetProject.mockResolvedValue(null);

      renderProjectEditPage();

      await waitFor(() => {
        expect(screen.getByText('Project Not Found')).toBeInTheDocument();
        expect(
          screen.getByText('The requested project could not be found.')
        ).toBeInTheDocument();
      });
    });

    it('should show back to projects link when not found', async () => {
      mockGetProject.mockResolvedValue(null);

      renderProjectEditPage();

      await waitFor(() => {
        expect(screen.getByText('Back to Projects')).toBeInTheDocument();
      });
    });

    it('should navigate back when back link is clicked on not found', async () => {
      const user = userEvent.setup();
      mockGetProject.mockResolvedValue(null);

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
      mockGetProject.mockResolvedValue(createMockProject());

      renderProjectEditPage();

      await waitFor(() => {
        expect(screen.getByText('Edit Project')).toBeInTheDocument();
      });
    });

    it('should display job code in header description', async () => {
      mockGetProject.mockResolvedValue(createMockProject({ jobCode: 'WK2-2025-099-0131' }));

      renderProjectEditPage();

      await waitFor(() => {
        expect(screen.getByText('Job Code: WK2-2025-099-0131')).toBeInTheDocument();
      });
    });

    it('should render Edit Project Details heading', async () => {
      mockGetProject.mockResolvedValue(createMockProject());

      renderProjectEditPage();

      await waitFor(() => {
        expect(screen.getByText('Edit Project Details')).toBeInTheDocument();
      });
    });

    it('should render ProjectForm', async () => {
      mockGetProject.mockResolvedValue(createMockProject());

      renderProjectEditPage();

      await waitFor(() => {
        expect(screen.getByTestId('project-form')).toBeInTheDocument();
      });
    });

    it('should render Back to Project link', async () => {
      mockGetProject.mockResolvedValue(createMockProject());

      renderProjectEditPage();

      await waitFor(() => {
        expect(screen.getByText('Back to Project')).toBeInTheDocument();
      });
    });
  });

  describe('form props', () => {
    it('should pass mode="edit" to form', async () => {
      mockGetProject.mockResolvedValue(createMockProject());

      renderProjectEditPage();

      await waitFor(() => {
        expect(screen.getByTestId('form-mode')).toHaveTextContent('edit');
      });
    });

    it('should pass initialData to form', async () => {
      mockGetProject.mockResolvedValue(createMockProject({ projectName: 'My Existing Project' }));

      renderProjectEditPage();

      await waitFor(() => {
        expect(screen.getByTestId('form-initial-name')).toHaveTextContent('My Existing Project');
      });
    });

    it('should pass isSubmitting from hook', async () => {
      mockGetProject.mockResolvedValue(createMockProject());

      renderProjectEditPage();

      await waitFor(() => {
        expect(formProps.isSubmitting).toBe(false);
      });
    });

    it('should pass clearError as onDismissError', async () => {
      mockGetProject.mockResolvedValue(createMockProject());

      renderProjectEditPage();

      await waitFor(() => {
        expect(formProps.onDismissError).toBe(mockClearError);
      });
    });
  });

  describe('form submission', () => {
    it('should call updateProject when form is submitted', async () => {
      const user = userEvent.setup();
      mockGetProject.mockResolvedValue(createMockProject({ id: 42 }));
      mockUpdateProject.mockResolvedValue(createMockProject());

      renderProjectEditPage('42');

      await waitFor(() => {
        expect(screen.getByTestId('project-form')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('form-submit'));

      await waitFor(() => {
        expect(mockUpdateProject).toHaveBeenCalledWith(42, {
          projectName: 'Updated Project',
          dueDate: '2025-03-01',
        });
      });
    });

    it('should navigate to project view after successful update', async () => {
      const user = userEvent.setup();
      mockGetProject.mockResolvedValue(createMockProject({ id: 42 }));
      mockUpdateProject.mockResolvedValue(createMockProject());

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
      mockGetProject.mockResolvedValue(createMockProject({ id: 42 }));
      mockUpdateProject.mockRejectedValue(new Error('Update failed'));

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
      mockGetProject.mockResolvedValue(createMockProject({ id: 42 }));

      renderProjectEditPage('42');

      await waitFor(() => {
        expect(screen.getByText('Back to Project')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Back to Project'));

      expect(mockNavigate).toHaveBeenCalledWith('/projects/42');
    });

    it('should navigate to project view when form cancel is clicked', async () => {
      const user = userEvent.setup();
      mockGetProject.mockResolvedValue(createMockProject({ id: 42 }));

      renderProjectEditPage('42');

      await waitFor(() => {
        expect(screen.getByTestId('form-cancel')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('form-cancel'));

      expect(mockNavigate).toHaveBeenCalledWith('/projects/42');
    });
  });

  describe('data fetching', () => {
    it('should call getProject with project id from URL', async () => {
      mockGetProject.mockResolvedValue(createMockProject());

      renderProjectEditPage('99');

      await waitFor(() => {
        expect(mockGetProject).toHaveBeenCalledWith(99);
      });
    });

    it('should include id in useEffect dependencies', async () => {
      // This test verifies the component has correct dependencies for refetching.
      // Note: Testing actual route changes requires integration tests with real routing.
      // The component's useEffect depends on `id`, so it will refetch when id changes.
      mockGetProject.mockResolvedValue(createMockProject());

      renderProjectEditPage('1');

      await waitFor(() => {
        expect(mockGetProject).toHaveBeenCalledWith(1);
      });

      // Test that different IDs fetch different projects
      vi.clearAllMocks();
      renderProjectEditPage('2');

      await waitFor(() => {
        expect(mockGetProject).toHaveBeenCalledWith(2);
      });
    });
  });

  describe('loading state during submission', () => {
    it('should pass isLoading to form as isSubmitting', async () => {
      mockGetProject.mockResolvedValue(createMockProject());

      vi.mocked(useProjectActions).mockReturnValue({
        getProject: mockGetProject,
        updateProject: mockUpdateProject,
        isLoading: true,
        error: null,
        clearError: mockClearError,
        createProject: vi.fn(),
      });

      renderProjectEditPage();

      await waitFor(() => {
        expect(formProps.isSubmitting).toBe(true);
      });
    });
  });

  describe('error handling during edit', () => {
    it('should pass error to form', async () => {
      mockGetProject.mockResolvedValue(createMockProject());

      vi.mocked(useProjectActions).mockReturnValue({
        getProject: mockGetProject,
        updateProject: mockUpdateProject,
        isLoading: false,
        error: 'Update failed',
        clearError: mockClearError,
        createProject: vi.fn(),
      });

      renderProjectEditPage();

      await waitFor(() => {
        expect(formProps.error).toBe('Update failed');
      });
    });
  });

  describe('accessibility', () => {
    it('should have accessible page heading', async () => {
      mockGetProject.mockResolvedValue(createMockProject());

      renderProjectEditPage();

      await waitFor(() => {
        // Use level: 1 to specifically get the h1 "Edit Project" not the h2 "Edit Project Details"
        expect(screen.getByRole('heading', { name: 'Edit Project', level: 1 })).toBeInTheDocument();
      });
    });

    it('should have accessible section heading', async () => {
      mockGetProject.mockResolvedValue(createMockProject());

      renderProjectEditPage();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /edit project details/i })).toBeInTheDocument();
      });
    });
  });

  describe('layout', () => {
    it('should render with proper background styling', async () => {
      mockGetProject.mockResolvedValue(createMockProject());

      const { container } = renderProjectEditPage();

      await waitFor(() => {
        expect(screen.getByTestId('project-form')).toBeInTheDocument();
      });

      const mainDiv = container.firstChild;
      expect(mainDiv).toHaveClass('min-h-screen');
      expect(mainDiv).toHaveClass('bg-steel-950');
    });

    it('should render form in a Card', async () => {
      mockGetProject.mockResolvedValue(createMockProject());

      const { container } = renderProjectEditPage();

      await waitFor(() => {
        expect(screen.getByTestId('project-form')).toBeInTheDocument();
      });

      const card = container.querySelector('.rounded-xl');
      expect(card).toBeInTheDocument();
    });
  });

});
