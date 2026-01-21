/**
 * CompanyManagementPanel Widget Tests.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockGetCompanyList = vi.hoisted(() => vi.fn());

vi.mock('@/entities/company', async () => {
  const actual = await vi.importActual<typeof import('@/entities/company')>('@/entities/company');
  return {
    ...actual,
    companyQueries: {
      ...actual.companyQueries,
      list: (params: { page: number; size: number; search: string; roleType: string | null }) => ({
        queryKey: ['companies', 'list', params],
        queryFn: () => mockGetCompanyList(params),
      }),
    },
  };
});

import { CompanyManagementPanel } from './CompanyManagementPanel';

const mockCompaniesData = {
  data: [
    {
      id: 1,
      name: 'Company A',
      businessNumber: '123-45-67890',
      roles: ['CUSTOMER'],
      contactName: 'John Doe',
      contactEmail: 'john@company-a.com',
    },
    {
      id: 2,
      name: 'Company B',
      businessNumber: '234-56-78901',
      roles: ['VENDOR'],
      contactName: 'Jane Smith',
      contactEmail: 'jane@company-b.com',
    },
  ],
  pagination: {
    totalElements: 2,
    totalPages: 1,
    first: true,
    last: true,
    size: 10,
    number: 0,
  },
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

describe('CompanyManagementPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loading state', () => {
    it('should show loading state while fetching', () => {
      mockGetCompanyList.mockImplementation(() => new Promise(() => {}));

      renderWithProviders(<CompanyManagementPanel />);

      expect(screen.getByText(/Loading companies/i)).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('should show error message on fetch failure', async () => {
      mockGetCompanyList.mockRejectedValue(new Error('Network error'));

      renderWithProviders(<CompanyManagementPanel />);

      await waitFor(() => {
        expect(screen.getByText(/Network error/)).toBeInTheDocument();
      });
    });

    it('should show retry button on error', async () => {
      mockGetCompanyList.mockRejectedValue(new Error('Failed'));

      renderWithProviders(<CompanyManagementPanel />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
      });
    });
  });

  describe('successful rendering', () => {
    it('should render company list', async () => {
      mockGetCompanyList.mockResolvedValue(mockCompaniesData);

      renderWithProviders(<CompanyManagementPanel />);

      await waitFor(() => {
        expect(screen.getByText('Company A')).toBeInTheDocument();
        expect(screen.getByText('Company B')).toBeInTheDocument();
      });
    });

    it('should show total company count', async () => {
      mockGetCompanyList.mockResolvedValue(mockCompaniesData);

      renderWithProviders(<CompanyManagementPanel />);

      await waitFor(() => {
        expect(screen.getByText(/Total 2 companies/i)).toBeInTheDocument();
      });
    });

    it('should render default title', async () => {
      mockGetCompanyList.mockResolvedValue(mockCompaniesData);

      renderWithProviders(<CompanyManagementPanel />);

      await waitFor(() => {
        expect(screen.getByText('Company Management')).toBeInTheDocument();
      });
    });

    it('should render custom title when provided', async () => {
      mockGetCompanyList.mockResolvedValue(mockCompaniesData);

      renderWithProviders(<CompanyManagementPanel title="Customer Management" />);

      await waitFor(() => {
        expect(screen.getByText('Customer Management')).toBeInTheDocument();
      });
    });
  });

  describe('create button', () => {
    it('should show create button by default', async () => {
      mockGetCompanyList.mockResolvedValue(mockCompaniesData);

      renderWithProviders(<CompanyManagementPanel />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Register Company/i })).toBeInTheDocument();
      });
    });

    it('should hide create button when showCreateButton is false', async () => {
      mockGetCompanyList.mockResolvedValue(mockCompaniesData);

      renderWithProviders(<CompanyManagementPanel showCreateButton={false} />);

      await waitFor(() => {
        expect(screen.getByText('Company A')).toBeInTheDocument();
      });

      expect(screen.queryByRole('button', { name: /Register Company/i })).not.toBeInTheDocument();
    });

    it('should navigate to create page when create button clicked', async () => {
      const user = userEvent.setup();
      mockGetCompanyList.mockResolvedValue(mockCompaniesData);

      renderWithProviders(<CompanyManagementPanel />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Register Company/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Register Company/i }));

      expect(mockNavigate).toHaveBeenCalledWith('/companies/create');
    });

    it('should use custom basePath for create navigation', async () => {
      const user = userEvent.setup();
      mockGetCompanyList.mockResolvedValue(mockCompaniesData);

      renderWithProviders(<CompanyManagementPanel basePath="/customers" />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Register Company/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Register Company/i }));

      expect(mockNavigate).toHaveBeenCalledWith('/customers/create');
    });
  });

  describe('search', () => {
    it('should render search input', async () => {
      mockGetCompanyList.mockResolvedValue(mockCompaniesData);

      renderWithProviders(<CompanyManagementPanel />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Search by company name/i)).toBeInTheDocument();
      });
    });

    it('should update search on input change', async () => {
      const user = userEvent.setup();
      mockGetCompanyList.mockResolvedValue(mockCompaniesData);

      renderWithProviders(<CompanyManagementPanel />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Search by company name/i)).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Search by company name/i);
      // Use clear then type to handle React state updates properly
      await user.clear(searchInput);
      await user.type(searchInput, 'A');

      await waitFor(() => {
        expect(searchInput).toHaveValue('A');
      });
    });
  });

  describe('company selection', () => {
    it('should call onCompanySelect when provided and row clicked', async () => {
      const user = userEvent.setup();
      const onCompanySelect = vi.fn();
      mockGetCompanyList.mockResolvedValue(mockCompaniesData);

      renderWithProviders(
        <CompanyManagementPanel onCompanySelect={onCompanySelect} />
      );

      await waitFor(() => {
        expect(screen.getByText('Company A')).toBeInTheDocument();
      });

      // Find and click the company row
      const companyRow = screen.getByText('Company A').closest('tr');
      if (companyRow) {
        await user.click(companyRow);
        expect(onCompanySelect).toHaveBeenCalledWith(
          expect.objectContaining({ id: 1, name: 'Company A' })
        );
      }
    });
  });

  describe('empty state', () => {
    it('should show empty message when no companies', async () => {
      mockGetCompanyList.mockResolvedValue({
        data: [],
        pagination: {
          totalElements: 0,
          totalPages: 0,
          first: true,
          last: true,
          size: 10,
          number: 0,
        },
      });

      renderWithProviders(<CompanyManagementPanel />);

      await waitFor(() => {
        expect(screen.getByText(/No companies registered/i)).toBeInTheDocument();
      });
    });
  });
});
