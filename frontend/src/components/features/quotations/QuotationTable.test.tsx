/**
 * Unit tests for QuotationTable component.
 * Tests data fetching, table rendering, and action callbacks.
 */

import { describe, expect, it, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuotationTable } from './QuotationTable';
import { quotationService } from '@/services';
import { createMockQuotation } from '@/test/fixtures';

// Mock the quotation service
vi.mock('@/services', () => ({
  quotationService: {
    getQuotations: vi.fn(),
  },
  QUOTATION_STATUS_LABELS: {
    DRAFT: '초안',
    PENDING: '승인대기',
    APPROVED: '승인됨',
    SENT: '발송됨',
    ACCEPTED: '수락됨',
    REJECTED: '반려됨',
  },
}));

describe('QuotationTable', () => {
  const mockGetQuotations = quotationService.getQuotations as Mock;

  const defaultProps = {
    page: 0,
    refreshTrigger: 0,
    onPageChange: vi.fn(),
    onView: vi.fn(),
  };

  const mockPagination = {
    page: 0,
    size: 10,
    totalElements: 1,
    totalPages: 1,
    first: true,
    last: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loading state', () => {
    it('should show loading state initially', () => {
      mockGetQuotations.mockImplementation(() => new Promise(() => {}));
      render(<QuotationTable {...defaultProps} />);

      expect(screen.getByText('Loading quotations...')).toBeInTheDocument();
    });

    it('should render table header during loading', () => {
      mockGetQuotations.mockImplementation(() => new Promise(() => {}));
      render(<QuotationTable {...defaultProps} />);

      expect(screen.getByText('Project / JobCode')).toBeInTheDocument();
      expect(screen.getByText('Version')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Total Amount')).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('should show error message on fetch failure', async () => {
      mockGetQuotations.mockRejectedValue(new Error('Network error'));
      render(<QuotationTable {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load quotations')).toBeInTheDocument();
      });
    });

    it('should call onError callback on fetch failure', async () => {
      const onError = vi.fn();
      mockGetQuotations.mockRejectedValue(new Error('Network error'));
      render(<QuotationTable {...defaultProps} onError={onError} />);

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Failed to load quotations');
      });
    });

    it('should show retry button on error', async () => {
      mockGetQuotations.mockRejectedValue(new Error('Network error'));
      render(<QuotationTable {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });

    it('should refetch when retry is clicked', async () => {
      mockGetQuotations.mockRejectedValueOnce(new Error('Error'));
      mockGetQuotations.mockResolvedValueOnce({
        data: [],
        pagination: mockPagination,
      });

      render(<QuotationTable {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Retry'));

      await waitFor(() => {
        expect(mockGetQuotations).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('empty state', () => {
    it('should show empty state when no quotations', async () => {
      mockGetQuotations.mockResolvedValue({
        data: [],
        pagination: mockPagination,
      });
      render(<QuotationTable {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('No quotations found.')).toBeInTheDocument();
      });
    });

    it('should show filtered empty state when status filter is applied', async () => {
      mockGetQuotations.mockResolvedValue({
        data: [],
        pagination: mockPagination,
      });
      render(<QuotationTable {...defaultProps} status="PENDING" />);

      await waitFor(() => {
        expect(screen.getByText('No quotations found with selected status.')).toBeInTheDocument();
      });
    });
  });

  describe('data rendering', () => {
    it('should render quotation data in table', async () => {
      const mockQuotation = createMockQuotation({
        id: 1,
        projectName: 'Test Project',
        jobCode: 'WK2-2025-001-0115',
        version: 2,
        status: 'DRAFT',
        totalAmount: 1500000,
        createdByName: 'John Doe',
      });
      mockGetQuotations.mockResolvedValue({
        data: [mockQuotation],
        pagination: mockPagination,
      });

      render(<QuotationTable {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
        expect(screen.getByText('WK2-2025-001-0115')).toBeInTheDocument();
        expect(screen.getByText('v2')).toBeInTheDocument();
        expect(screen.getByText('초안')).toBeInTheDocument();
        expect(screen.getByText('₩1,500,000')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    it('should render multiple quotations', async () => {
      const quotations = [
        createMockQuotation({ id: 1, projectName: 'Project One' }),
        createMockQuotation({ id: 2, projectName: 'Project Two' }),
        createMockQuotation({ id: 3, projectName: 'Project Three' }),
      ];
      mockGetQuotations.mockResolvedValue({
        data: quotations,
        pagination: { ...mockPagination, totalElements: 3 },
      });

      render(<QuotationTable {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Project One')).toBeInTheDocument();
        expect(screen.getByText('Project Two')).toBeInTheDocument();
        expect(screen.getByText('Project Three')).toBeInTheDocument();
      });
    });
  });

  describe('action buttons', () => {
    it('should always show view button', async () => {
      const mockQuotation = createMockQuotation({ status: 'APPROVED' });
      mockGetQuotations.mockResolvedValue({
        data: [mockQuotation],
        pagination: mockPagination,
      });

      render(<QuotationTable {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTitle('View quotation')).toBeInTheDocument();
      });
    });

    it('should show edit button only for DRAFT status', async () => {
      const mockQuotation = createMockQuotation({ status: 'DRAFT' });
      mockGetQuotations.mockResolvedValue({
        data: [mockQuotation],
        pagination: mockPagination,
      });

      render(<QuotationTable {...defaultProps} onEdit={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByTitle('Edit quotation')).toBeInTheDocument();
      });
    });

    it('should not show edit button for non-DRAFT status', async () => {
      const mockQuotation = createMockQuotation({ status: 'APPROVED' });
      mockGetQuotations.mockResolvedValue({
        data: [mockQuotation],
        pagination: mockPagination,
      });

      render(<QuotationTable {...defaultProps} onEdit={vi.fn()} />);

      await waitFor(() => {
        expect(screen.queryByTitle('Edit quotation')).not.toBeInTheDocument();
      });
    });

    it('should show submit button only for DRAFT status', async () => {
      const mockQuotation = createMockQuotation({ status: 'DRAFT' });
      mockGetQuotations.mockResolvedValue({
        data: [mockQuotation],
        pagination: mockPagination,
      });

      render(<QuotationTable {...defaultProps} onSubmit={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByTitle('Submit for approval')).toBeInTheDocument();
      });
    });

    it('should show download PDF button for non-DRAFT status', async () => {
      const mockQuotation = createMockQuotation({ status: 'APPROVED' });
      mockGetQuotations.mockResolvedValue({
        data: [mockQuotation],
        pagination: mockPagination,
      });

      render(<QuotationTable {...defaultProps} onDownloadPdf={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByTitle('Download PDF')).toBeInTheDocument();
      });
    });

    it('should not show download PDF button for DRAFT status', async () => {
      const mockQuotation = createMockQuotation({ status: 'DRAFT' });
      mockGetQuotations.mockResolvedValue({
        data: [mockQuotation],
        pagination: mockPagination,
      });

      render(<QuotationTable {...defaultProps} onDownloadPdf={vi.fn()} />);

      await waitFor(() => {
        expect(screen.queryByTitle('Download PDF')).not.toBeInTheDocument();
      });
    });

    it('should show create version button for APPROVED status', async () => {
      const mockQuotation = createMockQuotation({ status: 'APPROVED' });
      mockGetQuotations.mockResolvedValue({
        data: [mockQuotation],
        pagination: mockPagination,
      });

      render(<QuotationTable {...defaultProps} onCreateVersion={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByTitle('Create new version')).toBeInTheDocument();
      });
    });

    it('should not show create version button for DRAFT status', async () => {
      const mockQuotation = createMockQuotation({ status: 'DRAFT' });
      mockGetQuotations.mockResolvedValue({
        data: [mockQuotation],
        pagination: mockPagination,
      });

      render(<QuotationTable {...defaultProps} onCreateVersion={vi.fn()} />);

      await waitFor(() => {
        expect(screen.queryByTitle('Create new version')).not.toBeInTheDocument();
      });
    });
  });

  describe('action callbacks', () => {
    it('should call onView when view button is clicked', async () => {
      const onView = vi.fn();
      const mockQuotation = createMockQuotation({ id: 42 });
      mockGetQuotations.mockResolvedValue({
        data: [mockQuotation],
        pagination: mockPagination,
      });

      render(<QuotationTable {...defaultProps} onView={onView} />);

      await waitFor(() => {
        fireEvent.click(screen.getByTitle('View quotation'));
      });

      expect(onView).toHaveBeenCalledWith(mockQuotation);
    });

    it('should call onEdit when edit button is clicked', async () => {
      const onEdit = vi.fn();
      const mockQuotation = createMockQuotation({ id: 42, status: 'DRAFT' });
      mockGetQuotations.mockResolvedValue({
        data: [mockQuotation],
        pagination: mockPagination,
      });

      render(<QuotationTable {...defaultProps} onEdit={onEdit} />);

      await waitFor(() => {
        fireEvent.click(screen.getByTitle('Edit quotation'));
      });

      expect(onEdit).toHaveBeenCalledWith(mockQuotation);
    });

    it('should call onSubmit when submit button is clicked', async () => {
      const onSubmit = vi.fn();
      const mockQuotation = createMockQuotation({ id: 42, status: 'DRAFT' });
      mockGetQuotations.mockResolvedValue({
        data: [mockQuotation],
        pagination: mockPagination,
      });

      render(<QuotationTable {...defaultProps} onSubmit={onSubmit} />);

      await waitFor(() => {
        fireEvent.click(screen.getByTitle('Submit for approval'));
      });

      expect(onSubmit).toHaveBeenCalledWith(mockQuotation);
    });

    it('should call onDownloadPdf when download button is clicked', async () => {
      const onDownloadPdf = vi.fn();
      const mockQuotation = createMockQuotation({ id: 42, status: 'APPROVED' });
      mockGetQuotations.mockResolvedValue({
        data: [mockQuotation],
        pagination: mockPagination,
      });

      render(<QuotationTable {...defaultProps} onDownloadPdf={onDownloadPdf} />);

      await waitFor(() => {
        fireEvent.click(screen.getByTitle('Download PDF'));
      });

      expect(onDownloadPdf).toHaveBeenCalledWith(mockQuotation);
    });

    it('should call onCreateVersion when create version button is clicked', async () => {
      const onCreateVersion = vi.fn();
      const mockQuotation = createMockQuotation({ id: 42, status: 'APPROVED' });
      mockGetQuotations.mockResolvedValue({
        data: [mockQuotation],
        pagination: mockPagination,
      });

      render(<QuotationTable {...defaultProps} onCreateVersion={onCreateVersion} />);

      await waitFor(() => {
        fireEvent.click(screen.getByTitle('Create new version'));
      });

      expect(onCreateVersion).toHaveBeenCalledWith(mockQuotation);
    });
  });

  describe('data fetching', () => {
    it('should fetch data on mount', async () => {
      mockGetQuotations.mockResolvedValue({
        data: [],
        pagination: mockPagination,
      });

      render(<QuotationTable {...defaultProps} />);

      await waitFor(() => {
        expect(mockGetQuotations).toHaveBeenCalledWith({
          page: 0,
          size: 10,
          status: undefined,
          projectId: undefined,
        });
      });
    });

    it('should include status in fetch when provided', async () => {
      mockGetQuotations.mockResolvedValue({
        data: [],
        pagination: mockPagination,
      });

      render(<QuotationTable {...defaultProps} status="PENDING" />);

      await waitFor(() => {
        expect(mockGetQuotations).toHaveBeenCalledWith({
          page: 0,
          size: 10,
          status: 'PENDING',
          projectId: undefined,
        });
      });
    });

    it('should include projectId in fetch when provided', async () => {
      mockGetQuotations.mockResolvedValue({
        data: [],
        pagination: mockPagination,
      });

      render(<QuotationTable {...defaultProps} projectId={42} />);

      await waitFor(() => {
        expect(mockGetQuotations).toHaveBeenCalledWith({
          page: 0,
          size: 10,
          status: undefined,
          projectId: 42,
        });
      });
    });

    it('should refetch when page changes', async () => {
      mockGetQuotations.mockResolvedValue({
        data: [],
        pagination: mockPagination,
      });

      const { rerender } = render(<QuotationTable {...defaultProps} page={0} />);

      await waitFor(() => {
        expect(mockGetQuotations).toHaveBeenCalledTimes(1);
      });

      rerender(<QuotationTable {...defaultProps} page={1} />);

      await waitFor(() => {
        expect(mockGetQuotations).toHaveBeenCalledTimes(2);
        expect(mockGetQuotations).toHaveBeenLastCalledWith(
          expect.objectContaining({ page: 1 })
        );
      });
    });

    it('should refetch when refreshTrigger changes', async () => {
      mockGetQuotations.mockResolvedValue({
        data: [],
        pagination: mockPagination,
      });

      const { rerender } = render(<QuotationTable {...defaultProps} refreshTrigger={0} />);

      await waitFor(() => {
        expect(mockGetQuotations).toHaveBeenCalledTimes(1);
      });

      rerender(<QuotationTable {...defaultProps} refreshTrigger={1} />);

      await waitFor(() => {
        expect(mockGetQuotations).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('pagination', () => {
    it('should not render pagination when only one page', async () => {
      mockGetQuotations.mockResolvedValue({
        data: [createMockQuotation()],
        pagination: { ...mockPagination, totalPages: 1 },
      });

      render(<QuotationTable {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });

      expect(screen.queryByText('Previous')).not.toBeInTheDocument();
    });

    it('should render pagination when multiple pages', async () => {
      mockGetQuotations.mockResolvedValue({
        data: [createMockQuotation()],
        pagination: { ...mockPagination, totalPages: 3, totalElements: 30 },
      });

      render(<QuotationTable {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });

      // Pagination should be rendered
      expect(screen.getByText(/quotations/)).toBeInTheDocument();
    });
  });
});
