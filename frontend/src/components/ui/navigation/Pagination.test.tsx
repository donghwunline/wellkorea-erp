import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { Pagination } from './Pagination';

describe('Pagination', () => {
  const defaultProps = {
    currentPage: 0,
    totalItems: 100,
    itemsPerPage: 10,
    onPageChange: vi.fn(),
    isFirst: true,
    isLast: false,
  };

  describe('rendering', () => {
    it('should render navigation with aria-label', () => {
      render(<Pagination {...defaultProps} />);
      expect(screen.getByLabelText('Pagination')).toBeInTheDocument();
    });

    it('should render Previous and Next buttons', () => {
      render(<Pagination {...defaultProps} />);
      expect(screen.getByLabelText('Go to previous page')).toBeInTheDocument();
      expect(screen.getByLabelText('Go to next page')).toBeInTheDocument();
    });

    it('should display item range info by default', () => {
      render(<Pagination {...defaultProps} />);
      expect(screen.getByText(/Showing 1 - 10 of 100 entries/)).toBeInTheDocument();
    });

    it('should use custom item label', () => {
      render(<Pagination {...defaultProps} itemLabel="users" />);
      expect(screen.getByText(/Showing 1 - 10 of 100 users/)).toBeInTheDocument();
    });

    it('should hide info when showInfo is false', () => {
      render(<Pagination {...defaultProps} showInfo={false} />);
      expect(screen.queryByText(/Showing/)).not.toBeInTheDocument();
    });

    it('should calculate correct range for middle page', () => {
      render(<Pagination {...defaultProps} currentPage={5} isFirst={false} />);
      expect(screen.getByText(/Showing 51 - 60 of 100 entries/)).toBeInTheDocument();
    });

    it('should calculate correct range for last page', () => {
      render(
        <Pagination
          {...defaultProps}
          currentPage={9}
          isFirst={false}
          isLast={true}
        />,
      );
      expect(screen.getByText(/Showing 91 - 100 of 100 entries/)).toBeInTheDocument();
    });
  });

  describe('navigation', () => {
    it('should disable Previous button on first page', () => {
      render(<Pagination {...defaultProps} isFirst={true} />);
      expect(screen.getByLabelText('Go to previous page')).toBeDisabled();
    });

    it('should disable Next button on last page', () => {
      render(<Pagination {...defaultProps} isLast={true} />);
      expect(screen.getByLabelText('Go to next page')).toBeDisabled();
    });

    it('should enable both buttons on middle page', () => {
      render(<Pagination {...defaultProps} isFirst={false} isLast={false} />);
      expect(screen.getByLabelText('Go to previous page')).not.toBeDisabled();
      expect(screen.getByLabelText('Go to next page')).not.toBeDisabled();
    });

    it('should call onPageChange with currentPage - 1 when Previous clicked', async () => {
      const user = userEvent.setup();
      const handlePageChange = vi.fn();

      render(
        <Pagination
          {...defaultProps}
          currentPage={5}
          isFirst={false}
          onPageChange={handlePageChange}
        />,
      );

      await user.click(screen.getByLabelText('Go to previous page'));
      expect(handlePageChange).toHaveBeenCalledWith(4);
    });

    it('should call onPageChange with currentPage + 1 when Next clicked', async () => {
      const user = userEvent.setup();
      const handlePageChange = vi.fn();

      render(<Pagination {...defaultProps} onPageChange={handlePageChange} />);

      await user.click(screen.getByLabelText('Go to next page'));
      expect(handlePageChange).toHaveBeenCalledWith(1);
    });

    it('should not call onPageChange when Previous disabled', async () => {
      const user = userEvent.setup();
      const handlePageChange = vi.fn();

      render(
        <Pagination
          {...defaultProps}
          isFirst={true}
          onPageChange={handlePageChange}
        />,
      );

      await user.click(screen.getByLabelText('Go to previous page'));
      expect(handlePageChange).not.toHaveBeenCalled();
    });

    it('should not call onPageChange when Next disabled', async () => {
      const user = userEvent.setup();
      const handlePageChange = vi.fn();

      render(
        <Pagination
          {...defaultProps}
          isLast={true}
          onPageChange={handlePageChange}
        />,
      );

      await user.click(screen.getByLabelText('Go to next page'));
      expect(handlePageChange).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle single page correctly', () => {
      render(
        <Pagination
          {...defaultProps}
          currentPage={0}
          totalItems={5}
          itemsPerPage={10}
          isFirst={true}
          isLast={true}
        />,
      );
      expect(screen.getByText(/Showing 1 - 5 of 5 entries/)).toBeInTheDocument();
      expect(screen.getByLabelText('Go to previous page')).toBeDisabled();
      expect(screen.getByLabelText('Go to next page')).toBeDisabled();
    });

    it('should handle empty results', () => {
      render(
        <Pagination
          {...defaultProps}
          totalItems={0}
          isFirst={true}
          isLast={true}
        />,
      );
      expect(screen.getByText(/Showing 1 - 0 of 0 entries/)).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<Pagination {...defaultProps} />);
      expect(screen.getByLabelText('Pagination')).toBeInTheDocument();
      expect(screen.getByLabelText('Go to previous page')).toBeInTheDocument();
      expect(screen.getByLabelText('Go to next page')).toBeInTheDocument();
    });

    it('should properly disable buttons', () => {
      const { rerender } = render(<Pagination {...defaultProps} isFirst={true} />);
      expect(screen.getByLabelText('Go to previous page')).toHaveAttribute('disabled');

      rerender(<Pagination {...defaultProps} isLast={true} />);
      expect(screen.getByLabelText('Go to next page')).toHaveAttribute('disabled');
    });
  });
});
