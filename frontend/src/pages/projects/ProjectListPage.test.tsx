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
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ProjectListPage } from './ProjectListPage';

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

vi.mock('@/shared/lib/pagination', () => ({
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

// Mock useQuery
const mockRefetch = vi.fn();
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(() => ({
    data: {
      data: [{ id: 42, jobCode: 'WK2-2025-042', projectName: 'Test Project' }],
      pagination: {
        page: 0,
        size: 10,
        totalElements: 1,
        totalPages: 1,
        first: true,
        last: true,
      },
    },
    isLoading: false,
    error: null,
    refetch: mockRefetch,
  })),
}));

// Mock entity components - capture props for assertions
vi.mock('@/entities/project', () => ({
  projectQueries: {
    list: vi.fn(() => ({ queryKey: ['projects', 'list'] })),
  },
  ProjectTable: vi.fn((props: Record<string, unknown>) => {
    projectTableProps = props;
    return (
      <div data-testid="project-table">
        <button
          data-testid="trigger-row-click"
          onClick={() =>
            (props.onRowClick as (project: { id: number }) => void)({ id: 42 })
          }
        >
          Trigger Row Click
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

      expect(screen.getByText('프로젝트')).toBeInTheDocument();
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

      expect(
        screen.getByPlaceholderText(/search by job code or project name/i)
      ).toBeInTheDocument();
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
    it('should pass projects array', () => {
      renderProjectListPage();

      expect(Array.isArray(projectTableProps.projects)).toBe(true);
    });

    it('should pass onRowClick callback', () => {
      renderProjectListPage();

      expect(typeof projectTableProps.onRowClick).toBe('function');
    });
  });

  describe('navigation', () => {
    it('should navigate to create page when New Project is clicked', async () => {
      const user = userEvent.setup();
      renderProjectListPage();

      await user.click(screen.getByRole('button', { name: /new project/i }));

      expect(mockNavigate).toHaveBeenCalledWith('/projects/new');
    });

    it('should navigate to view page when row is clicked', async () => {
      const user = userEvent.setup();
      renderProjectListPage();

      await user.click(screen.getByTestId('trigger-row-click'));

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

  describe('accessibility', () => {
    it('should have accessible page heading', () => {
      renderProjectListPage();

      expect(screen.getByRole('heading', { name: /프로젝트/i })).toBeInTheDocument();
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
