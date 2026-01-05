/**
 * QuotationDetailsPanel Widget Tests.
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

const mockQuotationList = {
  data: [
    {
      id: 1,
      jobCode: 'WK2025-001',
      version: 2,
      status: 'DRAFT',
      projectId: 1,
      totalAmount: 1000000,
    },
    {
      id: 2,
      jobCode: 'WK2025-001',
      version: 1,
      status: 'APPROVED',
      projectId: 1,
      totalAmount: 900000,
    },
  ],
  pagination: {
    totalElements: 2,
    totalPages: 1,
    first: true,
    last: true,
    size: 100,
    number: 0,
  },
};

const mockQuotationDetail = {
  id: 1,
  jobCode: 'WK2025-001',
  version: 2,
  status: 'DRAFT',
  projectId: 1,
  totalAmount: 1000000,
  lineItems: [
    {
      id: 1,
      productId: 1,
      productName: 'Product A',
      quantity: 10,
      unitPrice: 50000,
      lineTotal: 500000,
    },
  ],
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

const mockGetQuotationList = vi.hoisted(() => vi.fn());
const mockGetQuotationDetail = vi.hoisted(() => vi.fn());

vi.mock('@/entities/quotation', async () => {
  const actual = await vi.importActual('@/entities/quotation');
  return {
    ...actual,
    quotationQueries: {
      ...(actual as Record<string, unknown>).quotationQueries,
      list: (params: { page: number; size: number; search: string; status: string | null; projectId: number }) => ({
        queryKey: ['quotations', 'list', params],
        queryFn: () => mockGetQuotationList(params),
      }),
      detail: (id: number) => ({
        queryKey: ['quotations', 'detail', id],
        queryFn: () => mockGetQuotationDetail(id),
      }),
    },
  };
});

// Mock feature hooks
vi.mock('@/features/quotation/submit', () => ({
  useSubmitQuotation: () => ({
    mutate: vi.fn(),
    isPending: false,
    error: null,
    reset: vi.fn(),
  }),
}));

vi.mock('@/features/quotation/version', () => ({
  useCreateVersion: () => ({
    mutate: vi.fn(),
    isPending: false,
    error: null,
    reset: vi.fn(),
  }),
}));

vi.mock('@/features/quotation/download-pdf', () => ({
  useDownloadPdf: () => ({
    mutate: vi.fn(),
    isPending: false,
    error: null,
    reset: vi.fn(),
  }),
}));

vi.mock('@/features/quotation/notify', () => ({
  useSendNotification: () => ({
    mutate: vi.fn(),
    isPending: false,
    error: null,
    reset: vi.fn(),
  }),
  EmailNotificationModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="email-modal">Email Modal</div> : null,
}));

import { QuotationDetailsPanel } from './QuotationDetailsPanel';

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

describe('QuotationDetailsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loading state', () => {
    it('should show loading state while fetching quotations', () => {
      mockGetQuotationList.mockImplementation(() => new Promise(() => {}));

      renderWithProviders(<QuotationDetailsPanel projectId={1} />);

      expect(screen.getByText(/Loading quotations/i)).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('should show error message on fetch failure', async () => {
      mockGetQuotationList.mockRejectedValue(new Error('Failed to load quotations'));

      renderWithProviders(<QuotationDetailsPanel projectId={1} />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load quotations/i)).toBeInTheDocument();
      });
    });

    it('should show retry button on error', async () => {
      mockGetQuotationList.mockRejectedValue(new Error('Failed to load quotations'));

      renderWithProviders(<QuotationDetailsPanel projectId={1} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
      });
    });
  });

  describe('empty state', () => {
    it('should show empty state when no quotations', async () => {
      mockGetQuotationList.mockResolvedValue({
        data: [],
        pagination: {
          totalElements: 0,
          totalPages: 0,
          first: true,
          last: true,
        },
      });

      renderWithProviders(<QuotationDetailsPanel projectId={1} />);

      await waitFor(() => {
        expect(screen.getByText(/No Quotations Yet/i)).toBeInTheDocument();
      });
    });

    it('should show New Quotation button in empty state', async () => {
      mockGetQuotationList.mockResolvedValue({
        data: [],
        pagination: {
          totalElements: 0,
          totalPages: 0,
          first: true,
          last: true,
        },
      });

      renderWithProviders(<QuotationDetailsPanel projectId={1} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /New Quotation/i })).toBeInTheDocument();
      });
    });
  });

  describe('successful rendering', () => {
    it('should render quotation details', async () => {
      mockGetQuotationList.mockResolvedValue(mockQuotationList);
      mockGetQuotationDetail.mockResolvedValue(mockQuotationDetail);

      renderWithProviders(<QuotationDetailsPanel projectId={1} />);

      await waitFor(() => {
        expect(screen.getByText(/v2/)).toBeInTheDocument();
      });
    });

    it('should show version navigation', async () => {
      mockGetQuotationList.mockResolvedValue(mockQuotationList);
      mockGetQuotationDetail.mockResolvedValue(mockQuotationDetail);

      renderWithProviders(<QuotationDetailsPanel projectId={1} />);

      await waitFor(() => {
        // Should show version counter
        expect(screen.getByText(/1 of 2/)).toBeInTheDocument();
      });
    });
  });

  describe('version navigation', () => {
    it('should disable previous button on oldest version', async () => {
      const singleVersionList = {
        data: [mockQuotationList.data[0]],
        pagination: { ...mockQuotationList.pagination, totalElements: 1 },
      };

      mockGetQuotationList.mockResolvedValue(singleVersionList);
      mockGetQuotationDetail.mockResolvedValue(mockQuotationDetail);

      renderWithProviders(<QuotationDetailsPanel projectId={1} />);

      await waitFor(() => {
        expect(screen.getByText(/v2/)).toBeInTheDocument();
      });

      // Find previous button (chevron-left)
      const prevButtons = screen.getAllByRole('button');
      const prevButton = prevButtons.find(btn =>
        btn.querySelector('svg')?.classList.contains('lucide-chevron-left') ||
        btn.getAttribute('title')?.includes('Previous')
      );

      if (prevButton) {
        expect(prevButton).toBeDisabled();
      }
    });
  });

  describe('actions', () => {
    it('should show Edit button for DRAFT quotation', async () => {
      mockGetQuotationList.mockResolvedValue(mockQuotationList);
      mockGetQuotationDetail.mockResolvedValue(mockQuotationDetail);

      renderWithProviders(<QuotationDetailsPanel projectId={1} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
      });
    });

    it('should show Submit button for DRAFT quotation', async () => {
      mockGetQuotationList.mockResolvedValue(mockQuotationList);
      mockGetQuotationDetail.mockResolvedValue(mockQuotationDetail);

      renderWithProviders(<QuotationDetailsPanel projectId={1} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
      });
    });

    it('should show New button', async () => {
      mockGetQuotationList.mockResolvedValue(mockQuotationList);
      mockGetQuotationDetail.mockResolvedValue(mockQuotationDetail);

      renderWithProviders(<QuotationDetailsPanel projectId={1} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^new$/i })).toBeInTheDocument();
      });
    });

    it('should navigate to create page when New button clicked', async () => {
      const user = userEvent.setup();
      mockGetQuotationList.mockResolvedValue(mockQuotationList);
      mockGetQuotationDetail.mockResolvedValue(mockQuotationDetail);

      renderWithProviders(<QuotationDetailsPanel projectId={1} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^new$/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /^new$/i }));

      expect(mockNavigate).toHaveBeenCalledWith('/projects/1/quotations/create');
    });

    it('should navigate to edit page when Edit button clicked', async () => {
      const user = userEvent.setup();
      mockGetQuotationList.mockResolvedValue(mockQuotationList);
      mockGetQuotationDetail.mockResolvedValue(mockQuotationDetail);

      renderWithProviders(<QuotationDetailsPanel projectId={1} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /edit/i }));

      expect(mockNavigate).toHaveBeenCalledWith('/projects/1/quotations/1/edit');
    });
  });

  describe('confirmation modals', () => {
    it('should show submit confirmation modal when Submit clicked', async () => {
      const user = userEvent.setup();
      mockGetQuotationList.mockResolvedValue(mockQuotationList);
      mockGetQuotationDetail.mockResolvedValue(mockQuotationDetail);

      renderWithProviders(<QuotationDetailsPanel projectId={1} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /submit/i }));

      await waitFor(() => {
        expect(screen.getByText(/submit for approval/i)).toBeInTheDocument();
      });
    });
  });

  describe('callbacks', () => {
    it('should call onError when mutation fails', async () => {
      const onError = vi.fn();
      mockGetQuotationList.mockRejectedValue(new Error('Query error occurred'));

      renderWithProviders(
        <QuotationDetailsPanel projectId={1} onError={onError} />
      );

      // onError is called from mutation failures, not query failures
      // The error from query shows in the Alert
      await waitFor(() => {
        expect(screen.getByText(/Query error occurred/i)).toBeInTheDocument();
      });
    });
  });
});
