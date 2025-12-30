import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { Alert } from './Alert';

describe('Alert', () => {
  describe('rendering', () => {
    it('should render with default props', () => {
      render(<Alert>Alert message</Alert>);
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Alert message')).toBeInTheDocument();
    });

    it('should render children', () => {
      render(<Alert>Test alert</Alert>);
      expect(screen.getByText('Test alert')).toBeInTheDocument();
    });

    it('should apply variant classes', () => {
      const { rerender } = render(<Alert variant="error">Error</Alert>);
      expect(screen.getByRole('alert')).toHaveClass(
        'border-red-500/20',
        'bg-red-500/10',
        'text-red-400'
      );

      rerender(<Alert variant="success">Success</Alert>);
      expect(screen.getByRole('alert')).toHaveClass(
        'border-green-500/20',
        'bg-green-500/10',
        'text-green-400'
      );

      rerender(<Alert variant="warning">Warning</Alert>);
      expect(screen.getByRole('alert')).toHaveClass(
        'border-orange-500/20',
        'bg-orange-500/10',
        'text-orange-400'
      );

      rerender(<Alert variant="info">Info</Alert>);
      expect(screen.getByRole('alert')).toHaveClass(
        'border-blue-500/20',
        'bg-blue-500/10',
        'text-blue-400'
      );
    });

    it('should apply custom className', () => {
      render(<Alert className="custom-class">Alert</Alert>);
      expect(screen.getByRole('alert')).toHaveClass('custom-class');
    });

    it('should render icon for each variant', () => {
      const { container, rerender } = render(<Alert variant="error">Error</Alert>);
      expect(container.querySelector('svg')).toBeInTheDocument();

      rerender(<Alert variant="success">Success</Alert>);
      expect(container.querySelector('svg')).toBeInTheDocument();

      rerender(<Alert variant="warning">Warning</Alert>);
      expect(container.querySelector('svg')).toBeInTheDocument();

      rerender(<Alert variant="info">Info</Alert>);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('dismiss functionality', () => {
    it('should not show close button by default', () => {
      render(<Alert>No dismiss</Alert>);
      expect(screen.queryByLabelText('Dismiss alert')).not.toBeInTheDocument();
    });

    it('should show close button when onClose provided', () => {
      render(<Alert onClose={vi.fn()}>Dismissible</Alert>);
      expect(screen.getByLabelText('Dismiss alert')).toBeInTheDocument();
    });

    it('should call onClose when close button clicked', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();
      render(<Alert onClose={handleClose}>Dismissible</Alert>);

      await user.click(screen.getByLabelText('Dismiss alert'));
      expect(handleClose).toHaveBeenCalledOnce();
    });
  });

  describe('accessibility', () => {
    it('should have role="alert"', () => {
      render(<Alert>Accessible</Alert>);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should have accessible dismiss button label', () => {
      render(<Alert onClose={vi.fn()}>Dismissible</Alert>);
      expect(screen.getByLabelText('Dismiss alert')).toBeInTheDocument();
    });
  });
});
