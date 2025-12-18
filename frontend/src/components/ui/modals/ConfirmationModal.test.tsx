import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { ConfirmationModal } from './ConfirmationModal';

describe('ConfirmationModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    title: 'Confirm Action',
    message: 'Are you sure?',
  };

  describe('rendering', () => {
    it('should render title and message', () => {
      render(<ConfirmationModal {...defaultProps} />);
      expect(screen.getByText('Confirm Action')).toBeInTheDocument();
      expect(screen.getByText('Are you sure?')).toBeInTheDocument();
    });

    it('should render default button labels', () => {
      render(<ConfirmationModal {...defaultProps} />);
      expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });

    it('should render custom button labels', () => {
      render(<ConfirmationModal {...defaultProps} confirmLabel="Delete" cancelLabel="Go Back" />);
      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go Back' })).toBeInTheDocument();
    });

    it('should render warning icon for danger variant', () => {
      const { container } = render(<ConfirmationModal {...defaultProps} variant="danger" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should render warning icon for warning variant', () => {
      const { container } = render(<ConfirmationModal {...defaultProps} variant="warning" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('actions', () => {
    it('should call onClose when cancel clicked', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();
      render(<ConfirmationModal {...defaultProps} onClose={handleClose} />);

      await user.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(handleClose).toHaveBeenCalledOnce();
    });

    it('should call onConfirm and onClose when confirmed', async () => {
      const user = userEvent.setup();
      const handleConfirm = vi.fn().mockResolvedValue(undefined);
      const handleClose = vi.fn();

      render(
        <ConfirmationModal {...defaultProps} onConfirm={handleConfirm} onClose={handleClose} />
      );

      await user.click(screen.getByRole('button', { name: 'Confirm' }));

      await waitFor(() => {
        expect(handleConfirm).toHaveBeenCalledOnce();
        expect(handleClose).toHaveBeenCalledOnce();
      });
    });

    it('should show loading state during async confirm', async () => {
      const user = userEvent.setup();
      const handleConfirm = vi.fn(
        () => new Promise<void>(resolve => setTimeout(() => resolve(), 100))
      );

      render(<ConfirmationModal {...defaultProps} onConfirm={handleConfirm} />);

      await user.click(screen.getByRole('button', { name: 'Confirm' }));

      // Should show spinner during loading
      expect(screen.getByRole('status')).toBeInTheDocument();

      // Buttons should be disabled during loading
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
      buttons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });

    it('should display error if confirm fails', async () => {
      const user = userEvent.setup();
      const handleConfirm = vi.fn().mockRejectedValue(new Error('Failed to delete'));

      render(<ConfirmationModal {...defaultProps} onConfirm={handleConfirm} />);

      await user.click(screen.getByRole('button', { name: 'Confirm' }));

      await waitFor(() => {
        expect(screen.getByText('Failed to delete')).toBeInTheDocument();
      });
    });

    it('should not close modal if confirm fails', async () => {
      const user = userEvent.setup();
      const handleConfirm = vi.fn().mockRejectedValue(new Error('Error'));
      const handleClose = vi.fn();

      render(
        <ConfirmationModal {...defaultProps} onConfirm={handleConfirm} onClose={handleClose} />
      );

      await user.click(screen.getByRole('button', { name: 'Confirm' }));

      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument();
      });

      expect(handleClose).not.toHaveBeenCalled();
    });
  });

  describe('variants', () => {
    it('should apply danger variant styles', () => {
      const { container } = render(<ConfirmationModal {...defaultProps} variant="danger" />);
      const iconContainer = container.querySelector('.bg-red-500\\/10');
      expect(iconContainer).toBeInTheDocument();
    });

    it('should apply warning variant styles', () => {
      const { container } = render(<ConfirmationModal {...defaultProps} variant="warning" />);
      const iconContainer = container.querySelector('.bg-orange-500\\/10');
      expect(iconContainer).toBeInTheDocument();
    });
  });
});
