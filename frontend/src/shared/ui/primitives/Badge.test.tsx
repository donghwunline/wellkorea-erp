import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';

describe('Badge', () => {
  describe('rendering', () => {
    it('should render with default props', () => {
      render(<Badge>Default</Badge>);
      expect(screen.getByText('Default')).toBeInTheDocument();
    });

    it('should render children', () => {
      render(<Badge>Active</Badge>);
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('should apply variant classes', () => {
      const { rerender } = render(<Badge variant="copper">Copper</Badge>);
      expect(screen.getByText('Copper')).toHaveClass('bg-copper-500/20', 'text-copper-400');

      rerender(<Badge variant="success">Success</Badge>);
      expect(screen.getByText('Success')).toHaveClass('bg-green-500/20', 'text-green-400');

      rerender(<Badge variant="danger">Danger</Badge>);
      expect(screen.getByText('Danger')).toHaveClass('bg-red-500/20', 'text-red-400');
    });

    it('should apply size classes', () => {
      const { rerender } = render(<Badge size="sm">Small</Badge>);
      expect(screen.getByText('Small')).toHaveClass('px-2', 'py-0.5', 'text-xs');

      rerender(<Badge size="md">Medium</Badge>);
      expect(screen.getByText('Medium')).toHaveClass('px-2.5', 'py-0.5', 'text-sm');
    });

    it('should apply custom className', () => {
      render(<Badge className="custom-class">Custom</Badge>);
      expect(screen.getByText('Custom')).toHaveClass('custom-class');
    });
  });

  describe('dot indicator', () => {
    it('should not show dot by default', () => {
      const { container } = render(<Badge>No Dot</Badge>);
      const dots = container.querySelectorAll('[aria-hidden="true"]');
      expect(dots).toHaveLength(0);
    });

    it('should show dot when enabled', () => {
      const { container } = render(<Badge dot>With Dot</Badge>);
      const dot = container.querySelector('[aria-hidden="true"]');
      expect(dot).toBeInTheDocument();
      expect(dot).toHaveClass('h-1.5', 'w-1.5', 'rounded-full');
    });

    it('should apply variant color to dot', () => {
      const { container } = render(
        <Badge variant="success" dot>
          Success
        </Badge>
      );
      const dot = container.querySelector('[aria-hidden="true"]');
      expect(dot).toHaveClass('bg-green-400');
    });
  });

  describe('accessibility', () => {
    it('should have inline-flex display for proper alignment', () => {
      render(<Badge>Accessible</Badge>);
      expect(screen.getByText('Accessible')).toHaveClass('inline-flex');
    });

    it('should mark dot as decorative with aria-hidden', () => {
      const { container } = render(<Badge dot>Status</Badge>);
      const dot = container.querySelector('[aria-hidden="true"]');
      expect(dot).toHaveAttribute('aria-hidden', 'true');
    });
  });
});
