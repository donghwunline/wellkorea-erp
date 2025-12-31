/**
 * Unit tests for ProjectCreatePage component.
 * Tests page rendering, form submission, success modal, navigation, and accessibility.
 *
 * Following Constitution Principle VI, this tests the page as a composition layer:
 * - Feature components are mocked (they own their service calls)
 * - useProjectActions hook is mocked
 * - Focus is on state management, navigation, and modal behavior
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ProjectCreatePage } from './ProjectCreatePage';
import type { CreateProjectRequest, ProjectCommandResult, UpdateProjectRequest } from '@/entities/project';

// Default mock command result for project creation
const DEFAULT_COMMAND_RESULT: ProjectCommandResult = {
  id: 42,
  message: 'Project created successfully',
  jobCode: 'WK2-2025-042-0120',
};

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
const mockCreateProject = vi.fn();
const mockClearError = vi.fn();

vi.mock('@/components/features/projects', () => ({
  useProjectActions: vi.fn(() => ({
    createProject: mockCreateProject,
    isLoading: false,
    error: null,
    clearError: mockClearError,
  })),
  ProjectForm: vi.fn((props: Record<string, unknown>) => {
    formProps = props;
    return (
      <div data-testid="project-form">
        <span data-testid="form-mode">{props.mode as string}</span>
        <button
          data-testid="form-submit"
          onClick={() =>
            (props.onSubmit as (data: CreateProjectRequest | UpdateProjectRequest) => Promise<void>)({
              customerId: 1,
              projectName: 'New Project',
              dueDate: '2025-02-15',
              internalOwnerId: 2,
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
  JobCodeSuccessModal: vi.fn((props: Record<string, unknown>) => {
    // Props are captured for rendering but not needed for assertions
    void props;
    return props.isOpen ? (
      <div data-testid="success-modal">
        <span data-testid="modal-job-code">{props.jobCode as string}</span>
        <button
          data-testid="modal-close"
          onClick={() => (props.onClose as () => void)()}
        >
          Close
        </button>
        <button
          data-testid="modal-view-project"
          onClick={() => (props.onViewProject as () => void)()}
        >
          View Project
        </button>
      </div>
    ) : null;
  }),
  SelectOption: {},
}));

// Import mocked hook for assertions
import { useProjectActions } from '@/components/features/projects';

// Helper to render with router
function renderProjectCreatePage() {
  return render(
    <BrowserRouter>
      <ProjectCreatePage />
    </BrowserRouter>
  );
}

describe('ProjectCreatePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    formProps = {};
    mockCreateProject.mockResolvedValue(DEFAULT_COMMAND_RESULT);

    // Reset the mock to default state
    vi.mocked(useProjectActions).mockReturnValue({
      createProject: mockCreateProject,
      isLoading: false,
      error: null,
      clearError: mockClearError,
      getProject: vi.fn(),
      updateProject: vi.fn(),
    });
  });

  describe('rendering', () => {
    it('should render page header with title', () => {
      renderProjectCreatePage();

      expect(screen.getByText('Create New Project')).toBeInTheDocument();
    });

    it('should render page description', () => {
      renderProjectCreatePage();

      expect(
        screen.getByText('Create a new project with auto-generated Job Code')
      ).toBeInTheDocument();
    });

    it('should render Back to Projects link', () => {
      renderProjectCreatePage();

      expect(screen.getByText('Back to Projects')).toBeInTheDocument();
    });

    it('should render Project Details heading', () => {
      renderProjectCreatePage();

      expect(screen.getByText('Project Details')).toBeInTheDocument();
    });

    it('should render ProjectForm', () => {
      renderProjectCreatePage();

      expect(screen.getByTestId('project-form')).toBeInTheDocument();
    });

    it('should not render success modal initially', () => {
      renderProjectCreatePage();

      expect(screen.queryByTestId('success-modal')).not.toBeInTheDocument();
    });
  });

  describe('form props', () => {
    it('should pass mode="create" to form', () => {
      renderProjectCreatePage();

      expect(screen.getByTestId('form-mode')).toHaveTextContent('create');
    });

    it('should pass isSubmitting from hook', () => {
      renderProjectCreatePage();

      expect(formProps.isSubmitting).toBe(false);
    });

    it('should pass error from hook', () => {
      vi.mocked(useProjectActions).mockReturnValue({
        createProject: mockCreateProject,
        isLoading: false,
        error: 'Test error',
        clearError: mockClearError,
        getProject: vi.fn(),
        updateProject: vi.fn(),
      });

      renderProjectCreatePage();

      expect(formProps.error).toBe('Test error');
    });

    it('should pass clearError as onDismissError', () => {
      renderProjectCreatePage();

      expect(formProps.onDismissError).toBe(mockClearError);
    });
  });

  describe('form submission', () => {
    it('should call createProject when form is submitted', async () => {
      const user = userEvent.setup();
      renderProjectCreatePage();

      await user.click(screen.getByTestId('form-submit'));

      await waitFor(() => {
        expect(mockCreateProject).toHaveBeenCalledWith({
          customerId: 1,
          projectName: 'New Project',
          dueDate: '2025-02-15',
          internalOwnerId: 2,
        });
      });
    });

    it('should show success modal after successful creation', async () => {
      const user = userEvent.setup();
      mockCreateProject.mockResolvedValue({
        ...DEFAULT_COMMAND_RESULT,
        jobCode: 'WK2-2025-099-0131',
      });

      renderProjectCreatePage();

      await user.click(screen.getByTestId('form-submit'));

      await waitFor(() => {
        expect(screen.getByTestId('success-modal')).toBeInTheDocument();
      });
    });

    it('should pass created job code to success modal', async () => {
      const user = userEvent.setup();
      mockCreateProject.mockResolvedValue({
        ...DEFAULT_COMMAND_RESULT,
        jobCode: 'WK2-2025-099-0131',
      });

      renderProjectCreatePage();

      await user.click(screen.getByTestId('form-submit'));

      await waitFor(() => {
        expect(screen.getByTestId('modal-job-code')).toHaveTextContent('WK2-2025-099-0131');
      });
    });
  });

  describe('navigation', () => {
    it('should navigate to projects list when back link is clicked', async () => {
      const user = userEvent.setup();
      renderProjectCreatePage();

      await user.click(screen.getByText('Back to Projects'));

      expect(mockNavigate).toHaveBeenCalledWith('/projects');
    });

    it('should navigate to projects list when form cancel is clicked', async () => {
      const user = userEvent.setup();
      renderProjectCreatePage();

      await user.click(screen.getByTestId('form-cancel'));

      expect(mockNavigate).toHaveBeenCalledWith('/projects');
    });

    it('should navigate to projects list when modal close is clicked', async () => {
      const user = userEvent.setup();
      mockCreateProject.mockResolvedValue(DEFAULT_COMMAND_RESULT);

      renderProjectCreatePage();

      // Submit form to show modal
      await user.click(screen.getByTestId('form-submit'));

      await waitFor(() => {
        expect(screen.getByTestId('success-modal')).toBeInTheDocument();
      });

      // Close modal
      await user.click(screen.getByTestId('modal-close'));

      expect(mockNavigate).toHaveBeenCalledWith('/projects');
    });

    it('should navigate to project view when View Project is clicked', async () => {
      const user = userEvent.setup();
      mockCreateProject.mockResolvedValue(DEFAULT_COMMAND_RESULT);

      renderProjectCreatePage();

      // Submit form to show modal
      await user.click(screen.getByTestId('form-submit'));

      await waitFor(() => {
        expect(screen.getByTestId('success-modal')).toBeInTheDocument();
      });

      // Click View Project
      await user.click(screen.getByTestId('modal-view-project'));

      expect(mockNavigate).toHaveBeenCalledWith('/projects/42');
    });
  });

  describe('loading state', () => {
    it('should pass isLoading to form', () => {
      vi.mocked(useProjectActions).mockReturnValue({
        createProject: mockCreateProject,
        isLoading: true,
        error: null,
        clearError: mockClearError,
        getProject: vi.fn(),
        updateProject: vi.fn(),
      });

      renderProjectCreatePage();

      expect(formProps.isSubmitting).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should not show modal when creation fails', async () => {
      const user = userEvent.setup();
      mockCreateProject.mockRejectedValue(new Error('Creation failed'));

      renderProjectCreatePage();

      await user.click(screen.getByTestId('form-submit'));

      // Wait a bit for any async operations
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(screen.queryByTestId('success-modal')).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have accessible page heading', () => {
      renderProjectCreatePage();

      expect(screen.getByRole('heading', { name: /create new project/i })).toBeInTheDocument();
    });

    it('should have accessible section heading', () => {
      renderProjectCreatePage();

      expect(screen.getByRole('heading', { name: /project details/i })).toBeInTheDocument();
    });
  });

  describe('layout', () => {
    it('should render with proper background styling', () => {
      const { container } = renderProjectCreatePage();

      const mainDiv = container.firstChild;
      expect(mainDiv).toHaveClass('min-h-screen');
      expect(mainDiv).toHaveClass('bg-steel-950');
    });

    it('should render form in a Card', () => {
      const { container } = renderProjectCreatePage();

      const card = container.querySelector('.rounded-xl');
      expect(card).toBeInTheDocument();
    });
  });
});
