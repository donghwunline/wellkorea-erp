/**
 * Unit tests for ProjectListPage component.
 * Tests page rendering, search interactions, navigation, error display, and accessibility.
 *
 * Following Constitution Principle VI, this tests the page as a composition layer:
 * - Feature components are mocked (they own their service calls)
 * - Shared hooks are mocked
 * - Focus is on props passing, navigation, and page-level interactions
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ProjectListPage } from './ProjectListPage';
import type { ProjectDetails } from '@/services';
// Import mocked hook for type-safe assertions
import { usePaginatedSearch } from '@/shared/hooks';

// Helper to render ProjectListPage with BrowserRouter
function renderProjectListPage() {
  return render(
    <BrowserRouter>
      <ProjectListPage />
    </BrowserRouter>
  );
}

// Track props passed to mocked components
let projectTableProps: Record<string, unknown> = {};

// Mock shared hooks
const mockNavigate = vi.fn();
const mockSetPage = vi.fn();
const mockHandleSearchChange = vi.fn();
const mockHandleSearchSubmit = vi.fn();
const mockHandleClearSearch = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/shared/hooks', () => ({
  usePaginatedSearch: vi.fn(() => ({
    page: 0,
    setPage: mockSetPage,
    search: '',
    searchInput: '',
    handleSearchChange: mockHandleSearchChange,
    handleSearchSubmit: mockHandleSearchSubmit,
    handleClearSearch: mockHandleClearSearch,
  })),
}));

// Mock feature components - capture props for assertions
vi.mock('@/components/features/projects', () => ({
  ProjectTable: vi.fn((props: Record<string, unknown>) => {
    projectTableProps = props;
    return (
      <div data-testid="project-table">
        <button
          data-testid="trigger-view"
          onClick={() =>
            (props.onView as (project: { id: number }) => void)({ id: 42 })
          }
        >
          Trigger View
        </button>
        <button
          data-testid="trigger-error"
          onClick={() => (props.onError as (error: string) => void)('Test error message')}
        >
          Trigger Error
        </button>
      </div>
    );
  }),
}));

describe('ProjectListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    projectTableProps = {};
  });

  describe('rendering', () => {
    it('should render page header with title', () => {
      renderProjectListPage();

      expect(screen.getByText('Projects')).toBeInTheDocument();
    });

    it('should render page description', () => {
      renderProjectListPage();

      expect(screen.getByText('Manage customer projects and job codes')).toBeInTheDocument();
    });

    it('should render New Project button', () => {
      renderProjectListPage();

      expect(screen.getByRole('button', { name: /new project/i })).toBeInTheDocument();
    });

    it('should render search bar', () => {
      renderProjectListPage();

      expect(screen.getByPlaceholderText(/search by job code or project name/i)).toBeInTheDocument();
    });

    it('should render Search button', () => {
      renderProjectListPage();

      expect(screen.getByRole('button', { name: /^search$/i })).toBeInTheDocument();
    });

    it('should render ProjectTable', () => {
      renderProjectListPage();

      expect(screen.getByTestId('project-table')).toBeInTheDocument();
    });

    it('should not render error alert initially', () => {
      renderProjectListPage();

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('props passed to ProjectTable', () => {
    it('should pass page from usePaginatedSearch', () => {
      renderProjectListPage();

      expect(projectTableProps.page).toBe(0);
    });

    it('should pass search from usePaginatedSearch', () => {
      renderProjectListPage();

      expect(projectTableProps.search).toBe('');
    });

    it('should pass setPage as onPageChange', () => {
      renderProjectListPage();

      expect(projectTableProps.onPageChange).toBe(mockSetPage);
    });

    it('should pass callback functions', () => {
      renderProjectListPage();

      expect(typeof projectTableProps.onView).toBe('function');
      expect(typeof projectTableProps.onError).toBe('function');
    });

    it('should pass custom page value when hook returns different page', () => {
      vi.mocked(usePaginatedSearch).mockReturnValue({
        page: 3,
        setPage: mockSetPage,
        search: 'project',
        searchInput: 'project',
        handleSearchChange: mockHandleSearchChange,
        handleSearchSubmit: mockHandleSearchSubmit,
        handleClearSearch: mockHandleClearSearch,
      });

      renderProjectListPage();

      expect(projectTableProps.page).toBe(3);
      expect(projectTableProps.search).toBe('project');
    });
  });

  describe('navigation', () => {
    it('should navigate to create page when New Project is clicked', async () => {
      const user = userEvent.setup();
      renderProjectListPage();

      await user.click(screen.getByRole('button', { name: /new project/i }));

      expect(mockNavigate).toHaveBeenCalledWith('/projects/new');
    });

    it('should navigate to view page when onView is triggered', async () => {
      const user = userEvent.setup();
      renderProjectListPage();

      await user.click(screen.getByTestId('trigger-view'));

      expect(mockNavigate).toHaveBeenCalledWith('/projects/42');
    });
  });

  describe('search interactions', () => {
    it('should call handleSearchSubmit when Search button is clicked', async () => {
      const user = userEvent.setup();
      renderProjectListPage();

      await user.click(screen.getByRole('button', { name: /^search$/i }));

      expect(mockHandleSearchSubmit).toHaveBeenCalledOnce();
    });

    it('should call handleSearchSubmit when Enter is pressed in search bar', async () => {
      const user = userEvent.setup();
      renderProjectListPage();

      const searchInput = screen.getByPlaceholderText(/search by job code or project name/i);
      await user.type(searchInput, '{Enter}');

      expect(mockHandleSearchSubmit).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should display error alert when onError is triggered', async () => {
      const user = userEvent.setup();
      renderProjectListPage();

      await user.click(screen.getByTestId('trigger-error'));

      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });

    it('should dismiss error alert when close button is clicked', async () => {
      const user = userEvent.setup();
      renderProjectListPage();

      // Trigger error
      await user.click(screen.getByTestId('trigger-error'));
      expect(screen.getByText('Test error message')).toBeInTheDocument();

      // Find and click close button in alert
      const alert = screen.getByRole('alert');
      const closeButton = within(alert).getByRole('button');
      await user.click(closeButton);

      expect(screen.queryByText('Test error message')).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have accessible page heading', () => {
      renderProjectListPage();

      expect(screen.getByRole('heading', { name: /projects/i })).toBeInTheDocument();
    });

    it('should have accessible New Project button', () => {
      renderProjectListPage();

      const button = screen.getByRole('button', { name: /new project/i });
      expect(button).toBeInTheDocument();
    });

    it('should have accessible Search button', () => {
      renderProjectListPage();

      const button = screen.getByRole('button', { name: /^search$/i });
      expect(button).toBeInTheDocument();
    });

    it('should have accessible search input with placeholder', () => {
      renderProjectListPage();

      const input = screen.getByPlaceholderText(/search by job code or project name/i);
      expect(input).toBeInTheDocument();
    });
  });

  describe('layout', () => {
    it('should render with proper background styling', () => {
      const { container } = renderProjectListPage();

      const mainDiv = container.firstChild;
      expect(mainDiv).toHaveClass('min-h-screen');
      expect(mainDiv).toHaveClass('bg-steel-950');
    });
  });
});
