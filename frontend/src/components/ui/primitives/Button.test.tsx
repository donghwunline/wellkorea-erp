/**
 * Tests for Button component
 */

import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  describe('rendering', () => {
    it('should render with text children', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });

    it('should apply primary variant classes by default', () => {
      render(<Button>Primary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-copper-500');
    });

    it('should apply secondary variant classes', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-steel-800');
    });

    it('should apply ghost variant classes', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-transparent');
    });

    it('should apply danger variant classes', () => {
      render(<Button variant="danger">Danger</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-red-500');
    });

    it('should apply medium size classes by default', () => {
      render(<Button>Medium</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-10');
    });

    it('should apply small size classes', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-8');
    });

    it('should apply large size classes', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-11');
    });

    it('should apply icon size classes', () => {
      render(<Button size="icon" aria-label="Icon button" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-10', 'w-10');
    });

    it('should apply custom className', () => {
      render(<Button className="custom-class">Custom</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });
  });

  describe('type attribute', () => {
    it('should default to type="button"', () => {
      render(<Button>Default Type</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('should accept custom type', () => {
      render(<Button type="submit">Submit</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
    });
  });

  describe('interaction', () => {
    it('should call onClick when clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<Button onClick={handleClick}>Click me</Button>);

      await user.click(screen.getByRole('button', { name: 'Click me' }));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(
        <Button onClick={handleClick} disabled>
          Disabled
        </Button>,
      );

      await user.click(screen.getByRole('button', { name: 'Disabled' }));

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should not call onClick when loading', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(
        <Button onClick={handleClick} isLoading>
          Loading
        </Button>,
      );

      const button = screen.getByRole('button');
      await user.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('loading state', () => {
    it('should render spinner when loading', () => {
      render(<Button isLoading>Loading</Button>);
      const button = screen.getByRole('button');

      // Spinner should be present (has role="status")
      const spinner = button.querySelector('svg[role="status"]');
      expect(spinner).toBeInTheDocument();
    });

    it('should be disabled when loading', () => {
      render(<Button isLoading>Loading</Button>);
      const button = screen.getByRole('button');

      expect(button).toBeDisabled();
    });

    it('should have aria-busy attribute when loading', () => {
      render(<Button isLoading>Loading</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('should not have aria-busy when not loading', () => {
      render(<Button>Not Loading</Button>);
      const button = screen.getByRole('button');

      expect(button).not.toHaveAttribute('aria-busy');
    });
  });

  describe('accessibility', () => {
    it('should have aria-disabled when disabled', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).toBeDisabled();
    });

    it('should have aria-disabled when loading', () => {
      render(<Button isLoading>Loading</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).toBeDisabled();
    });

    it('should not have aria-disabled when enabled', () => {
      render(<Button>Enabled</Button>);
      const button = screen.getByRole('button');

      expect(button).not.toHaveAttribute('aria-disabled');
      expect(button).not.toBeDisabled();
    });

    it('should support aria-label for icon buttons', () => {
      render(<Button size="icon" aria-label="Delete item" />);
      const button = screen.getByRole('button', { name: 'Delete item' });

      expect(button).toBeInTheDocument();
    });
  });

  describe('ref forwarding', () => {
    it('should forward ref to button element', () => {
      const ref = { current: null as HTMLButtonElement | null };

      render(<Button ref={ref}>With Ref</Button>);

      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
      expect(ref.current?.textContent).toBe('With Ref');
    });
  });
});
