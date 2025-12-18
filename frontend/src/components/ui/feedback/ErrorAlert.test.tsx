import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { ErrorAlert } from './ErrorAlert';

describe('ErrorAlert', () => {
  describe('rendering', () => {
    it('renders error message', () => {
      render(<ErrorAlert message="Something went wrong" />);
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('renders error icon', () => {
      const { container } = render(<ErrorAlert message="Error" />);
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('text-red-400');
    });

    it('does not render dismiss button when onDismiss is not provided', () => {
      render(<ErrorAlert message="Error" />);
      expect(screen.queryByLabelText('Dismiss error')).not.toBeInTheDocument();
    });

    it('renders dismiss button when onDismiss is provided', () => {
      render(<ErrorAlert message="Error" onDismiss={vi.fn()} />);
      expect(screen.getByLabelText('Dismiss error')).toBeInTheDocument();
    });
  });

  describe('interaction', () => {
    it('calls onDismiss when dismiss button is clicked', async () => {
      const user = userEvent.setup();
      const handleDismiss = vi.fn();
      render(<ErrorAlert message="Error" onDismiss={handleDismiss} />);

      await user.click(screen.getByLabelText('Dismiss error'));

      expect(handleDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('styling', () => {
    it('applies error alert styling classes', () => {
      const { container } = render(<ErrorAlert message="Error" />);
      const alert = container.firstChild as HTMLElement;
      expect(alert).toHaveClass('border-red-500/20', 'bg-red-500/10');
    });

    it('merges custom className', () => {
      const { container } = render(<ErrorAlert message="Error" className="custom-error" />);
      const alert = container.firstChild as HTMLElement;
      expect(alert).toHaveClass('custom-error');
      expect(alert).toHaveClass('border-red-500/20'); // Base class still applied
    });

    it('applies proper text styling to message', () => {
      render(<ErrorAlert message="Error message" />);
      const message = screen.getByText('Error message');
      expect(message).toHaveClass('text-sm', 'text-red-200');
    });

    it('styles dismiss button correctly', () => {
      render(<ErrorAlert message="Error" onDismiss={vi.fn()} />);
      const dismissButton = screen.getByLabelText('Dismiss error');
      expect(dismissButton).toHaveClass('text-red-400', 'hover:bg-red-500/20');
    });
  });

  describe('accessibility', () => {
    it('has role="alert" for screen readers', () => {
      render(<ErrorAlert message="Error" />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('dismiss button has aria-label', () => {
      render(<ErrorAlert message="Error" onDismiss={vi.fn()} />);
      const dismissButton = screen.getByLabelText('Dismiss error');
      expect(dismissButton).toHaveAttribute('aria-label', 'Dismiss error');
    });

    it('error icon is visible to assistive technologies', () => {
      const { container } = render(<ErrorAlert message="Error" />);
      const icon = container.querySelector('svg');
      expect(icon).not.toHaveAttribute('aria-hidden');
    });
  });

  describe('layout', () => {
    it('uses flexbox layout', () => {
      const { container } = render(<ErrorAlert message="Error" />);
      const alert = container.firstChild as HTMLElement;
      expect(alert).toHaveClass('flex', 'items-start', 'gap-3');
    });

    it('icon does not shrink', () => {
      const { container } = render(<ErrorAlert message="Error" />);
      const icon = container.querySelector('svg');
      expect(icon).toHaveClass('shrink-0');
    });

    it('message takes available space', () => {
      render(<ErrorAlert message="Error" />);
      const message = screen.getByText('Error');
      expect(message).toHaveClass('flex-1');
    });

    it('dismiss button does not shrink when present', () => {
      render(<ErrorAlert message="Error" onDismiss={vi.fn()} />);
      const dismissButton = screen.getByLabelText('Dismiss error');
      expect(dismissButton).toHaveClass('shrink-0');
    });
  });

  describe('HTML attributes', () => {
    it('passes through additional HTML attributes', () => {
      render(<ErrorAlert message="Error" data-testid="error-alert" aria-live="polite" />);
      const alert = screen.getByTestId('error-alert');
      expect(alert).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('content', () => {
    it('handles long error messages', () => {
      const longMessage = 'This is a very long error message that should wrap properly and maintain readability across multiple lines in the error alert component.';
      render(<ErrorAlert message={longMessage} />);
      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('handles error messages with special characters', () => {
      const specialMessage = 'Error: Failed to load <data> from "API" & save it';
      render(<ErrorAlert message={specialMessage} />);
      expect(screen.getByText(specialMessage)).toBeInTheDocument();
    });
  });
});
