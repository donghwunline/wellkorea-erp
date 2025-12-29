/**
 * Unit tests for CompanyTable component.
 * Tests data fetching, rendering, filtering, pagination, and user interactions.
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CompanyTable } from './CompanyTable';
import { companyService } from '@/services';
import type { CompanySummary, PaginatedCompanies } from '@/services';

// Mock companyService
vi.mock('@/services', () => ({
  companyService: {
    getCompanies: vi.fn(),
  },
  ROLE_TYPE_LABELS: {
    CUSTOMER: '고객사',
    VENDOR: '협력업체',
    OUTSOURCE: '외주업체',
  },
}));

// ============================================================================
// Test Fixtures
// ============================================================================

function createMockCompanySummary(overrides?: Partial<CompanySummary>): CompanySummary {
  return {
    id: 1,
    name: 'Test Company',
    registrationNumber: '123-45-67890',
    contactPerson: 'John Doe',
    phone: '02-1234-5678',
    email: 'contact@test.com',
    roles: [
      { id: 1, roleType: 'CUSTOMER', creditLimit: null, defaultPaymentDays: null, notes: null, createdAt: '2025-01-01T00:00:00Z' },
    ],
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

function createMockPaginatedResponse(
  companies: CompanySummary[],
  options: { page?: number; totalElements?: number; totalPages?: number } = {}
): PaginatedCompanies {
  const { page = 0, totalElements = companies.length, totalPages = 1 } = options;
  return {
    data: companies,
    pagination: {
      page,
      size: 10,
      totalElements,
      totalPages,
      first: page === 0,
      last: page >= totalPages - 1,
    },
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('CompanyTable', () => {
  const mockOnPageChange = vi.fn();
  const mockOnView = vi.fn();
  const mockOnEdit = vi.fn();
  const mockOnError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // LOADING STATE
  // ==========================================================================

  describe('loading state', () => {
    it('should show loading state while fetching', async () => {
      // Given: Pending request
      vi.mocked(companyService.getCompanies).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(
        <CompanyTable
          page={0}
          search=""
          onPageChange={mockOnPageChange}
          onView={mockOnView}
        />
      );

      // Then: Shows loading message
      expect(screen.getByText(/loading companies/i)).toBeInTheDocument();
    });

    it('should show table headers during loading', async () => {
      vi.mocked(companyService.getCompanies).mockImplementation(
        () => new Promise(() => {})
      );

      render(
        <CompanyTable
          page={0}
          search=""
          onPageChange={mockOnPageChange}
          onView={mockOnView}
        />
      );

      expect(screen.getByText('Company Name')).toBeInTheDocument();
      expect(screen.getByText('Registration No.')).toBeInTheDocument();
      expect(screen.getByText('Contact')).toBeInTheDocument();
      expect(screen.getByText('Roles')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // DATA DISPLAY
  // ==========================================================================

  describe('data display', () => {
    it('should render company data in table rows', async () => {
      const mockCompany = createMockCompanySummary({
        name: 'Samsung Electronics',
        registrationNumber: '111-22-33333',
        contactPerson: 'Kim Manager',
        phone: '02-9999-8888',
        email: 'kim@samsung.com',
      });
      vi.mocked(companyService.getCompanies).mockResolvedValue(
        createMockPaginatedResponse([mockCompany])
      );

      render(
        <CompanyTable
          page={0}
          search=""
          onPageChange={mockOnPageChange}
          onView={mockOnView}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Samsung Electronics')).toBeInTheDocument();
      });

      expect(screen.getByText('111-22-33333')).toBeInTheDocument();
      expect(screen.getByText('Kim Manager')).toBeInTheDocument();
      expect(screen.getByText('02-9999-8888')).toBeInTheDocument();
      expect(screen.getByText('kim@samsung.com')).toBeInTheDocument();
    });

    it('should display role badges', async () => {
      const mockCompany = createMockCompanySummary({
        roles: [
          { id: 1, roleType: 'CUSTOMER', creditLimit: null, defaultPaymentDays: null, notes: null, createdAt: '2025-01-01T00:00:00Z' },
          { id: 2, roleType: 'VENDOR', creditLimit: null, defaultPaymentDays: null, notes: null, createdAt: '2025-01-01T00:00:00Z' },
        ],
      });
      vi.mocked(companyService.getCompanies).mockResolvedValue(
        createMockPaginatedResponse([mockCompany])
      );

      render(
        <CompanyTable
          page={0}
          search=""
          onPageChange={mockOnPageChange}
          onView={mockOnView}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('고객사')).toBeInTheDocument();
      });
      expect(screen.getByText('협력업체')).toBeInTheDocument();
    });

    it('should display dash for missing optional fields', async () => {
      const mockCompany = createMockCompanySummary({
        registrationNumber: null,
        contactPerson: null,
        phone: null,
      });
      vi.mocked(companyService.getCompanies).mockResolvedValue(
        createMockPaginatedResponse([mockCompany])
      );

      render(
        <CompanyTable
          page={0}
          search=""
          onPageChange={mockOnPageChange}
          onView={mockOnView}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Company')).toBeInTheDocument();
      });

      // Should show '-' for missing fields
      const dashElements = screen.getAllByText('-');
      expect(dashElements.length).toBeGreaterThan(0);
    });

    it('should render multiple companies', async () => {
      const companies = [
        createMockCompanySummary({ id: 1, name: 'Company A' }),
        createMockCompanySummary({ id: 2, name: 'Company B' }),
        createMockCompanySummary({ id: 3, name: 'Company C' }),
      ];
      vi.mocked(companyService.getCompanies).mockResolvedValue(
        createMockPaginatedResponse(companies)
      );

      render(
        <CompanyTable
          page={0}
          search=""
          onPageChange={mockOnPageChange}
          onView={mockOnView}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Company A')).toBeInTheDocument();
      });
      expect(screen.getByText('Company B')).toBeInTheDocument();
      expect(screen.getByText('Company C')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // EMPTY STATE
  // ==========================================================================

  describe('empty state', () => {
    it('should show empty message when no companies', async () => {
      vi.mocked(companyService.getCompanies).mockResolvedValue(
        createMockPaginatedResponse([])
      );

      render(
        <CompanyTable
          page={0}
          search=""
          onPageChange={mockOnPageChange}
          onView={mockOnView}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/no companies found/i)).toBeInTheDocument();
      });
    });

    it('should show search-specific empty message', async () => {
      vi.mocked(companyService.getCompanies).mockResolvedValue(
        createMockPaginatedResponse([])
      );

      render(
        <CompanyTable
          page={0}
          search="nonexistent"
          onPageChange={mockOnPageChange}
          onView={mockOnView}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/no companies found matching your search/i)).toBeInTheDocument();
      });
    });

    it('should show role-specific empty message', async () => {
      vi.mocked(companyService.getCompanies).mockResolvedValue(
        createMockPaginatedResponse([])
      );

      render(
        <CompanyTable
          page={0}
          search=""
          roleType="VENDOR"
          onPageChange={mockOnPageChange}
          onView={mockOnView}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/no 협력업체 found/i)).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // ERROR STATE
  // ==========================================================================

  describe('error state', () => {
    it('should show error message on fetch failure', async () => {
      vi.mocked(companyService.getCompanies).mockRejectedValue(
        new Error('Network error')
      );

      render(
        <CompanyTable
          page={0}
          search=""
          onPageChange={mockOnPageChange}
          onView={mockOnView}
          onError={mockOnError}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/failed to load companies/i)).toBeInTheDocument();
      });
    });

    it('should call onError callback on failure', async () => {
      vi.mocked(companyService.getCompanies).mockRejectedValue(
        new Error('Network error')
      );

      render(
        <CompanyTable
          page={0}
          search=""
          onPageChange={mockOnPageChange}
          onView={mockOnView}
          onError={mockOnError}
        />
      );

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Failed to load companies');
      });
    });

    it('should show retry button on error', async () => {
      vi.mocked(companyService.getCompanies).mockRejectedValue(
        new Error('Network error')
      );

      render(
        <CompanyTable
          page={0}
          search=""
          onPageChange={mockOnPageChange}
          onView={mockOnView}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/retry/i)).toBeInTheDocument();
      });
    });

    it('should retry fetch when retry button is clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(companyService.getCompanies)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(createMockPaginatedResponse([createMockCompanySummary()]));

      render(
        <CompanyTable
          page={0}
          search=""
          onPageChange={mockOnPageChange}
          onView={mockOnView}
        />
      );

      // Wait for error
      await waitFor(() => {
        expect(screen.getByText(/retry/i)).toBeInTheDocument();
      });

      // Click retry
      await user.click(screen.getByText(/retry/i));

      // Should show data after retry
      await waitFor(() => {
        expect(screen.getByText('Test Company')).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // USER INTERACTIONS
  // ==========================================================================

  describe('user interactions', () => {
    it('should call onView when view button is clicked', async () => {
      const user = userEvent.setup();
      const mockCompany = createMockCompanySummary({ id: 42, name: 'Click Test' });
      vi.mocked(companyService.getCompanies).mockResolvedValue(
        createMockPaginatedResponse([mockCompany])
      );

      render(
        <CompanyTable
          page={0}
          search=""
          onPageChange={mockOnPageChange}
          onView={mockOnView}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Click Test')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /view company/i }));

      expect(mockOnView).toHaveBeenCalledOnce();
      expect(mockOnView).toHaveBeenCalledWith(mockCompany);
    });

    it('should call onEdit when edit button is clicked', async () => {
      const user = userEvent.setup();
      const mockCompany = createMockCompanySummary({ id: 55 });
      vi.mocked(companyService.getCompanies).mockResolvedValue(
        createMockPaginatedResponse([mockCompany])
      );

      render(
        <CompanyTable
          page={0}
          search=""
          onPageChange={mockOnPageChange}
          onView={mockOnView}
          onEdit={mockOnEdit}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Company')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /edit company/i }));

      expect(mockOnEdit).toHaveBeenCalledOnce();
      expect(mockOnEdit).toHaveBeenCalledWith(mockCompany);
    });

    it('should not render edit button when onEdit is not provided', async () => {
      vi.mocked(companyService.getCompanies).mockResolvedValue(
        createMockPaginatedResponse([createMockCompanySummary()])
      );

      render(
        <CompanyTable
          page={0}
          search=""
          onPageChange={mockOnPageChange}
          onView={mockOnView}
          // onEdit not provided
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Company')).toBeInTheDocument();
      });

      expect(screen.queryByRole('button', { name: /edit company/i })).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // DATA FETCHING
  // ==========================================================================

  describe('data fetching', () => {
    it('should fetch data on mount', async () => {
      vi.mocked(companyService.getCompanies).mockResolvedValue(
        createMockPaginatedResponse([])
      );

      render(
        <CompanyTable
          page={0}
          search=""
          onPageChange={mockOnPageChange}
          onView={mockOnView}
        />
      );

      await waitFor(() => {
        expect(companyService.getCompanies).toHaveBeenCalledOnce();
      });
    });

    it('should pass page and size params', async () => {
      vi.mocked(companyService.getCompanies).mockResolvedValue(
        createMockPaginatedResponse([])
      );

      render(
        <CompanyTable
          page={5}
          search=""
          onPageChange={mockOnPageChange}
          onView={mockOnView}
        />
      );

      await waitFor(() => {
        expect(companyService.getCompanies).toHaveBeenCalledWith({
          page: 5,
          size: 10,
          search: undefined,
          roleType: undefined,
        });
      });
    });

    it('should pass search param when provided', async () => {
      vi.mocked(companyService.getCompanies).mockResolvedValue(
        createMockPaginatedResponse([])
      );

      render(
        <CompanyTable
          page={0}
          search="samsung"
          onPageChange={mockOnPageChange}
          onView={mockOnView}
        />
      );

      await waitFor(() => {
        expect(companyService.getCompanies).toHaveBeenCalledWith({
          page: 0,
          size: 10,
          search: 'samsung',
          roleType: undefined,
        });
      });
    });

    it('should pass roleType param when provided', async () => {
      vi.mocked(companyService.getCompanies).mockResolvedValue(
        createMockPaginatedResponse([])
      );

      render(
        <CompanyTable
          page={0}
          search=""
          roleType="CUSTOMER"
          onPageChange={mockOnPageChange}
          onView={mockOnView}
        />
      );

      await waitFor(() => {
        expect(companyService.getCompanies).toHaveBeenCalledWith({
          page: 0,
          size: 10,
          search: undefined,
          roleType: 'CUSTOMER',
        });
      });
    });

    it('should refetch when page changes', async () => {
      vi.mocked(companyService.getCompanies).mockResolvedValue(
        createMockPaginatedResponse([])
      );

      const { rerender } = render(
        <CompanyTable
          page={0}
          search=""
          onPageChange={mockOnPageChange}
          onView={mockOnView}
        />
      );

      await waitFor(() => {
        expect(companyService.getCompanies).toHaveBeenCalledTimes(1);
      });

      rerender(
        <CompanyTable
          page={1}
          search=""
          onPageChange={mockOnPageChange}
          onView={mockOnView}
        />
      );

      await waitFor(() => {
        expect(companyService.getCompanies).toHaveBeenCalledTimes(2);
      });
    });

    it('should refetch when search changes', async () => {
      vi.mocked(companyService.getCompanies).mockResolvedValue(
        createMockPaginatedResponse([])
      );

      const { rerender } = render(
        <CompanyTable
          page={0}
          search=""
          onPageChange={mockOnPageChange}
          onView={mockOnView}
        />
      );

      await waitFor(() => {
        expect(companyService.getCompanies).toHaveBeenCalledTimes(1);
      });

      rerender(
        <CompanyTable
          page={0}
          search="new search"
          onPageChange={mockOnPageChange}
          onView={mockOnView}
        />
      );

      await waitFor(() => {
        expect(companyService.getCompanies).toHaveBeenCalledTimes(2);
      });
    });

    it('should refetch when refreshTrigger changes', async () => {
      vi.mocked(companyService.getCompanies).mockResolvedValue(
        createMockPaginatedResponse([])
      );

      const { rerender } = render(
        <CompanyTable
          page={0}
          search=""
          refreshTrigger={0}
          onPageChange={mockOnPageChange}
          onView={mockOnView}
        />
      );

      await waitFor(() => {
        expect(companyService.getCompanies).toHaveBeenCalledTimes(1);
      });

      rerender(
        <CompanyTable
          page={0}
          search=""
          refreshTrigger={1}
          onPageChange={mockOnPageChange}
          onView={mockOnView}
        />
      );

      await waitFor(() => {
        expect(companyService.getCompanies).toHaveBeenCalledTimes(2);
      });
    });
  });

  // ==========================================================================
  // PAGINATION
  // ==========================================================================

  describe('pagination', () => {
    it('should render pagination when multiple pages', async () => {
      vi.mocked(companyService.getCompanies).mockResolvedValue(
        createMockPaginatedResponse([createMockCompanySummary()], {
          totalElements: 50,
          totalPages: 5,
        })
      );

      render(
        <CompanyTable
          page={0}
          search=""
          onPageChange={mockOnPageChange}
          onView={mockOnView}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Company')).toBeInTheDocument();
      });

      // Should show pagination
      expect(screen.getByText(/50/)).toBeInTheDocument(); // Total items
    });

    it('should not render pagination for single page', async () => {
      vi.mocked(companyService.getCompanies).mockResolvedValue(
        createMockPaginatedResponse([createMockCompanySummary()], {
          totalElements: 5,
          totalPages: 1,
        })
      );

      render(
        <CompanyTable
          page={0}
          search=""
          onPageChange={mockOnPageChange}
          onView={mockOnView}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Company')).toBeInTheDocument();
      });

      // Should not show pagination component (look for prev/next buttons)
      expect(screen.queryByRole('button', { name: /previous/i })).not.toBeInTheDocument();
    });
  });
});
