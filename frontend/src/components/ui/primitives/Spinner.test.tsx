import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Spinner } from './Spinner';

describe('Spinner', () => {
  describe('rendering', () => {
    it('should render with default props', () => {
      render(<Spinner />);
      const spinner = screen.getByRole('status');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveAttribute('aria-label', 'Loading');
    });

    it('should render with custom label', () => {
      render(<Spinner label="Loading users" />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('aria-label', 'Loading users');
    });

    it('should apply size classes', () => {
      const { rerender } = render(<Spinner size="sm" />);
      expect(screen.getByRole('status')).toHaveClass('h-4', 'w-4');

      rerender(<Spinner size="lg" />);
      expect(screen.getByRole('status')).toHaveClass('h-8', 'w-8');

      rerender(<Spinner size="xl" />);
      expect(screen.getByRole('status')).toHaveClass('h-12', 'w-12');
    });

    it('should apply variant classes', () => {
      const { rerender } = render(<Spinner variant="copper" />);
      expect(screen.getByRole('status')).toHaveClass('text-copper-500');

      rerender(<Spinner variant="steel" />);
      expect(screen.getByRole('status')).toHaveClass('text-steel-400');

      rerender(<Spinner variant="white" />);
      expect(screen.getByRole('status')).toHaveClass('text-white');
    });

    it('should apply custom className', () => {
      render(<Spinner className="custom-class" />);
      expect(screen.getByRole('status')).toHaveClass('custom-class');
    });
  });

  describe('accessibility', () => {
    it('should have role="status"', () => {
      render(<Spinner />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should have aria-label', () => {
      render(<Spinner label="Processing" />);
      expect(screen.getByLabelText('Processing')).toBeInTheDocument();
    });
  });
});
