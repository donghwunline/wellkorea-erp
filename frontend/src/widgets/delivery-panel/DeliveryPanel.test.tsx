/**
 * DeliveryPanel Widget Tests.
 *
 * Tests for loading, error, empty states, and delivery list display.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import type { Delivery, DeliveryStatus } from '@/entities/delivery';

// =============================================================================
// Mock Setup
// =============================================================================

// Mock auth hook
const mockHasAnyRole = vi.fn();

vi.mock('@/entities/auth', () => ({
  useAuth: () => ({
    hasAnyRole: mockHasAnyRole,
  }),
}));

// Mock formatDate
vi.mock('@/shared/lib/formatting', () => ({
  formatDate: (date: string) => `formatted-${date}`,
}));

// Mock delivery queries
const mockGetDeliveries = vi.hoisted(() => vi.fn());
const mockGetQuotationList = vi.hoisted(() => vi.fn());

vi.mock('@/entities/delivery', async () => {
  const actual = await vi.importActual<typeof import('@/entities/delivery')>('@/entities/delivery');
  return {
    ...actual,
    deliveryQueries: {
      ...actual.deliveryQueries,
      list: (params: { projectId: number }) => ({
        queryKey: ['deliveries', 'list', params.projectId],
        queryFn: () => mockGetDeliveries(params),
      }),
    },
  };
});

vi.mock('@/entities/quotation', async () => {
  const actual = await vi.importActual<typeof import('@/entities/quotation')>('@/entities/quotation');
  return {
    ...actual,
    quotationQueries: {
      ...actual.quotationQueries,
      list: (params: { page: number; size: number; search: string; status: string | null; projectId: number }) => ({
        queryKey: ['quotations', 'list', params],
        queryFn: () => mockGetQuotationList(params),
      }),
    },
    QuotationStatus: {
      APPROVED: 'APPROVED',
    },
  };
});

import { DeliveryPanel } from './DeliveryPanel';

// =============================================================================
// Test Data Factories
// =============================================================================

function createMockDelivery(overrides: Partial<Delivery> = {}): Delivery {
  return {
    id: 1,
    projectId: 100,
    jobCode: 'WK2025-001',
    deliveryDate: '2025-01-07',
    status: 'PENDING' as DeliveryStatus,
    deliveredById: 5,
    deliveredByName: 'John Doe',
    notes: 'Test notes',
    createdAt: '2025-01-07T10:00:00Z',
    updatedAt: '2025-01-07T10:00:00Z',
    lineItems: [
      {
        id: 1,
        productId: 1,
        productName: 'Product A',
        productSku: 'SKU-001',
        quantityDelivered: 30,
      },
      {
        id: 2,
        productId: 2,
        productName: 'Product B',
        productSku: null,
        quantityDelivered: 20,
      },
    ],
    ...overrides,
  };
}

function createMockQuotationList(hasApproved: boolean) {
  return {
    data: hasApproved
      ? [{ id: 1, status: 'APPROVED', projectId: 100 }]
      : [],
    pagination: {
      totalElements: hasApproved ? 1 : 0,
      totalPages: 1,
      first: true,
      last: true,
      size: 1,
      number: 0,
    },
  };
}

// =============================================================================
// Test Utilities
// =============================================================================

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
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('DeliveryPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasAnyRole.mockReturnValue(true); // Default: user can create deliveries
  });

  // ==========================================================================
  // Loading State
  // ==========================================================================

  describe('loading state', () => {
    it('should show loading state while fetching deliveries', () => {
      mockGetDeliveries.mockImplementation(() => new Promise(() => {}));
      mockGetQuotationList.mockImplementation(() => new Promise(() => {}));

      renderWithProviders(<DeliveryPanel projectId={100} />);

      expect(screen.getByText(/Loading delivery data/i)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Error State
  // ==========================================================================

  describe('error state', () => {
    it('should show error message when deliveries fail to load', async () => {
      mockGetDeliveries.mockRejectedValue(new Error('Failed to load deliveries'));
      mockGetQuotationList.mockResolvedValue(createMockQuotationList(true));

      renderWithProviders(<DeliveryPanel projectId={100} />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load deliveries/i)).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // Empty State - No Approved Quotation
  // ==========================================================================

  describe('no approved quotation state', () => {
    it('should show no approved quotation message when quotation not approved', async () => {
      mockGetDeliveries.mockResolvedValue([]);
      mockGetQuotationList.mockResolvedValue(createMockQuotationList(false));

      renderWithProviders(<DeliveryPanel projectId={100} />);

      await waitFor(() => {
        expect(screen.getByText(/No Approved Quotation/i)).toBeInTheDocument();
        expect(
          screen.getByText(/A quotation must be approved before recording deliveries/i)
        ).toBeInTheDocument();
      });
    });

    it('should not show Record Delivery button when no approved quotation', async () => {
      mockGetDeliveries.mockResolvedValue([]);
      mockGetQuotationList.mockResolvedValue(createMockQuotationList(false));

      renderWithProviders(<DeliveryPanel projectId={100} />);

      await waitFor(() => {
        expect(screen.getByText(/No Approved Quotation/i)).toBeInTheDocument();
      });

      expect(screen.queryByRole('button', { name: /Record Delivery/i })).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Empty State - No Deliveries
  // ==========================================================================

  describe('no deliveries state', () => {
    it('should show empty state when no deliveries exist', async () => {
      mockGetDeliveries.mockResolvedValue([]);
      mockGetQuotationList.mockResolvedValue(createMockQuotationList(true));

      renderWithProviders(<DeliveryPanel projectId={100} />);

      await waitFor(() => {
        expect(screen.getByText(/No Deliveries Yet/i)).toBeInTheDocument();
        expect(
          screen.getByText(/No deliveries have been recorded for this project/i)
        ).toBeInTheDocument();
      });
    });

    it('should show Record Delivery button in empty state for authorized users', async () => {
      mockGetDeliveries.mockResolvedValue([]);
      mockGetQuotationList.mockResolvedValue(createMockQuotationList(true));
      mockHasAnyRole.mockReturnValue(true);

      renderWithProviders(<DeliveryPanel projectId={100} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Record Delivery/i })).toBeInTheDocument();
      });
    });

    it('should not show Record Delivery button in empty state for unauthorized users', async () => {
      mockGetDeliveries.mockResolvedValue([]);
      mockGetQuotationList.mockResolvedValue(createMockQuotationList(true));
      mockHasAnyRole.mockReturnValue(false);

      renderWithProviders(<DeliveryPanel projectId={100} />);

      await waitFor(() => {
        expect(screen.getByText(/No Deliveries Yet/i)).toBeInTheDocument();
      });

      expect(screen.queryByRole('button', { name: /Record Delivery/i })).not.toBeInTheDocument();
    });

    it('should open create modal when Record Delivery clicked in empty state', async () => {
      const user = userEvent.setup();
      mockGetDeliveries.mockResolvedValue([]);
      mockGetQuotationList.mockResolvedValue(createMockQuotationList(true));
      mockHasAnyRole.mockReturnValue(true);

      renderWithProviders(<DeliveryPanel projectId={100} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Record Delivery/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Record Delivery/i }));

      // Modal should open - check for modal title
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // Successful Rendering with Deliveries
  // ==========================================================================

  describe('successful rendering', () => {
    it('should render deliveries table with data', async () => {
      const deliveries = [
        createMockDelivery({ id: 1, deliveredByName: 'John Doe' }),
        createMockDelivery({ id: 2, deliveredByName: 'Jane Smith', status: 'DELIVERED' }),
      ];
      mockGetDeliveries.mockResolvedValue(deliveries);
      mockGetQuotationList.mockResolvedValue(createMockQuotationList(true));

      renderWithProviders(<DeliveryPanel projectId={100} />);

      await waitFor(() => {
        expect(screen.getByText('#1')).toBeInTheDocument();
        expect(screen.getByText('#2')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });
    });

    it('should render summary stats cards', async () => {
      const deliveries = [
        createMockDelivery({ id: 1, status: 'PENDING' }),
        createMockDelivery({ id: 2, status: 'DELIVERED' }),
        createMockDelivery({ id: 3, status: 'PENDING' }),
      ];
      mockGetDeliveries.mockResolvedValue(deliveries);
      mockGetQuotationList.mockResolvedValue(createMockQuotationList(true));

      renderWithProviders(<DeliveryPanel projectId={100} />);

      await waitFor(() => {
        // Total Deliveries
        expect(screen.getByText('Total Deliveries')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();

        // Pending count
        expect(screen.getByText('Pending')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();

        // Delivered count
        expect(screen.getByText('Delivered')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument();
      });
    });

    it('should show formatted delivery date', async () => {
      const deliveries = [createMockDelivery({ deliveryDate: '2025-01-07' })];
      mockGetDeliveries.mockResolvedValue(deliveries);
      mockGetQuotationList.mockResolvedValue(createMockQuotationList(true));

      renderWithProviders(<DeliveryPanel projectId={100} />);

      await waitFor(() => {
        expect(screen.getByText('formatted-2025-01-07')).toBeInTheDocument();
      });
    });

    it('should show line items count and total quantity', async () => {
      const deliveries = [
        createMockDelivery({
          lineItems: [
            { id: 1, productId: 1, productName: 'A', productSku: null, quantityDelivered: 30 },
            { id: 2, productId: 2, productName: 'B', productSku: null, quantityDelivered: 20 },
          ],
        }),
      ];
      mockGetDeliveries.mockResolvedValue(deliveries);
      mockGetQuotationList.mockResolvedValue(createMockQuotationList(true));

      renderWithProviders(<DeliveryPanel projectId={100} />);

      await waitFor(() => {
        // 2 items, 50 units total
        expect(screen.getByText(/2 items \(50 units\)/)).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // Role-based Access Control
  // ==========================================================================

  describe('role-based access', () => {
    it('should check for ROLE_ADMIN and ROLE_FINANCE', async () => {
      mockGetDeliveries.mockResolvedValue([createMockDelivery()]);
      mockGetQuotationList.mockResolvedValue(createMockQuotationList(true));

      renderWithProviders(<DeliveryPanel projectId={100} />);

      await waitFor(() => {
        expect(mockHasAnyRole).toHaveBeenCalledWith(['ROLE_ADMIN', 'ROLE_FINANCE']);
      });
    });

    it('should show Record Delivery button when user has required role', async () => {
      mockGetDeliveries.mockResolvedValue([createMockDelivery()]);
      mockGetQuotationList.mockResolvedValue(createMockQuotationList(true));
      mockHasAnyRole.mockReturnValue(true);

      renderWithProviders(<DeliveryPanel projectId={100} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Record Delivery/i })).toBeInTheDocument();
      });
    });

    it('should hide Record Delivery button when user lacks required role', async () => {
      mockGetDeliveries.mockResolvedValue([createMockDelivery()]);
      mockGetQuotationList.mockResolvedValue(createMockQuotationList(true));
      mockHasAnyRole.mockReturnValue(false);

      renderWithProviders(<DeliveryPanel projectId={100} />);

      await waitFor(() => {
        expect(screen.getByText('#1')).toBeInTheDocument();
      });

      expect(screen.queryByRole('button', { name: /Record Delivery/i })).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Actions
  // ==========================================================================

  describe('actions', () => {
    it('should open create modal when Record Delivery button clicked', async () => {
      const user = userEvent.setup();
      mockGetDeliveries.mockResolvedValue([createMockDelivery()]);
      mockGetQuotationList.mockResolvedValue(createMockQuotationList(true));
      mockHasAnyRole.mockReturnValue(true);

      renderWithProviders(<DeliveryPanel projectId={100} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Record Delivery/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Record Delivery/i }));

      // Modal should open
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('should open detail modal when view button clicked', async () => {
      const user = userEvent.setup();
      mockGetDeliveries.mockResolvedValue([createMockDelivery({ id: 123 })]);
      mockGetQuotationList.mockResolvedValue(createMockQuotationList(true));

      renderWithProviders(<DeliveryPanel projectId={100} />);

      await waitFor(() => {
        expect(screen.getByText('#123')).toBeInTheDocument();
      });

      // Find the view button (eye icon) - it's titled "View Details"
      const viewButton = screen.getByTitle('View Details');
      await user.click(viewButton);

      // Detail modal should open
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('should have download statement button', async () => {
      mockGetDeliveries.mockResolvedValue([createMockDelivery({ id: 123 })]);
      mockGetQuotationList.mockResolvedValue(createMockQuotationList(true));

      renderWithProviders(<DeliveryPanel projectId={100} />);

      await waitFor(() => {
        expect(screen.getByTitle('Download Statement PDF')).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // Table Headers
  // ==========================================================================

  describe('table structure', () => {
    it('should render table headers', async () => {
      mockGetDeliveries.mockResolvedValue([createMockDelivery()]);
      mockGetQuotationList.mockResolvedValue(createMockQuotationList(true));

      renderWithProviders(<DeliveryPanel projectId={100} />);

      await waitFor(() => {
        expect(screen.getByText('ID')).toBeInTheDocument();
        expect(screen.getByText('Delivery Date')).toBeInTheDocument();
        expect(screen.getByText('Delivered By')).toBeInTheDocument();
        expect(screen.getByText('Items')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
        expect(screen.getByText('Actions')).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('edge cases', () => {
    it('should handle delivery with zero line items', async () => {
      const deliveries = [createMockDelivery({ lineItems: [] })];
      mockGetDeliveries.mockResolvedValue(deliveries);
      mockGetQuotationList.mockResolvedValue(createMockQuotationList(true));

      renderWithProviders(<DeliveryPanel projectId={100} />);

      await waitFor(() => {
        expect(screen.getByText(/0 items \(0 units\)/)).toBeInTheDocument();
      });
    });

    it('should calculate total items delivered correctly', async () => {
      const deliveries = [
        createMockDelivery({
          id: 1,
          lineItems: [
            { id: 1, productId: 1, productName: 'A', productSku: null, quantityDelivered: 100 },
          ],
        }),
        createMockDelivery({
          id: 2,
          lineItems: [
            { id: 2, productId: 2, productName: 'B', productSku: null, quantityDelivered: 200 },
          ],
        }),
      ];
      mockGetDeliveries.mockResolvedValue(deliveries);
      mockGetQuotationList.mockResolvedValue(createMockQuotationList(true));

      renderWithProviders(<DeliveryPanel projectId={100} />);

      await waitFor(() => {
        // Items Delivered should be 300 (100 + 200)
        expect(screen.getByText('Items Delivered')).toBeInTheDocument();
        expect(screen.getByText('300')).toBeInTheDocument();
      });
    });

    it('should handle deliveries with all statuses', async () => {
      const deliveries = [
        createMockDelivery({ id: 1, status: 'PENDING' }),
        createMockDelivery({ id: 2, status: 'DELIVERED' }),
        createMockDelivery({ id: 3, status: 'RETURNED' }),
      ];
      mockGetDeliveries.mockResolvedValue(deliveries);
      mockGetQuotationList.mockResolvedValue(createMockQuotationList(true));

      renderWithProviders(<DeliveryPanel projectId={100} />);

      await waitFor(() => {
        // Total Deliveries should show 3
        expect(screen.getByText('Total Deliveries')).toBeInTheDocument();
      });

      // Verify all status types are displayed
      await waitFor(() => {
        expect(screen.getByText('#1')).toBeInTheDocument();
        expect(screen.getByText('#2')).toBeInTheDocument();
        expect(screen.getByText('#3')).toBeInTheDocument();
      });
    });
  });
});
