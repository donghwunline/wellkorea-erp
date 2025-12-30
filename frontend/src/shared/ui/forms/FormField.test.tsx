import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef } from 'react';
import { FormField } from './FormField';

describe('FormField', () => {
  describe('rendering', () => {
    it('renders with label and input', () => {
      render(<FormField label="Email" value="" onChange={vi.fn()} id="email" />);
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });

    it('renders with value', () => {
      render(<FormField label="Email" value="test@example.com" onChange={vi.fn()} id="email" />);
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    });

    it('renders required indicator when required', () => {
      render(<FormField label="Email" value="" onChange={vi.fn()} required id="email" />);
      expect(screen.getByText('*')).toBeInTheDocument();
      expect(screen.getByText('*')).toHaveClass('text-red-400');
    });

    it('does not render required indicator when not required', () => {
      render(<FormField label="Email" value="" onChange={vi.fn()} id="email" />);
      expect(screen.queryByText('*')).not.toBeInTheDocument();
    });

    it('renders error message when provided', () => {
      render(
        <FormField label="Email" value="" onChange={vi.fn()} error="Invalid email" id="email" />
      );
      expect(screen.getByText('Invalid email')).toBeInTheDocument();
    });

    it('does not render error message when not provided', () => {
      const { container } = render(
        <FormField label="Email" value="" onChange={vi.fn()} id="email" />
      );
      expect(container.querySelector('.text-red-400')).not.toBeInTheDocument();
    });
  });

  describe('interaction', () => {
    it('calls onChange with new value when typing', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<FormField label="Email" value="" onChange={handleChange} id="email" />);

      const input = screen.getByLabelText('Email');
      await user.type(input, 'test');

      expect(handleChange).toHaveBeenCalledTimes(4); // One call per character
      expect(handleChange).toHaveBeenNthCalledWith(1, 't');
      expect(handleChange).toHaveBeenNthCalledWith(2, 'e');
      expect(handleChange).toHaveBeenNthCalledWith(3, 's');
      expect(handleChange).toHaveBeenNthCalledWith(4, 't');
    });

    it('updates value correctly', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      const { rerender } = render(
        <FormField label="Email" value="" onChange={handleChange} id="email" />
      );

      const input = screen.getByLabelText('Email');
      await user.type(input, 'a');

      rerender(<FormField label="Email" value="a" onChange={handleChange} id="email" />);
      expect(input).toHaveValue('a');
    });

    it('can be disabled', () => {
      render(<FormField label="Email" value="" onChange={vi.fn()} disabled id="email" />);
      expect(screen.getByLabelText('Email')).toBeDisabled();
    });
  });

  describe('styling', () => {
    it('applies error styles when error is provided', () => {
      render(<FormField label="Email" value="" onChange={vi.fn()} error="Invalid" id="email" />);
      const input = screen.getByLabelText('Email');
      expect(input).toHaveClass('border-red-500/50');
    });

    it('applies disabled styles when disabled', () => {
      render(<FormField label="Email" value="" onChange={vi.fn()} disabled id="email" />);
      const input = screen.getByLabelText('Email');
      expect(input).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50');
    });

    it('merges custom className', () => {
      render(
        <FormField label="Email" value="" onChange={vi.fn()} className="custom-class" id="email" />
      );
      const input = screen.getByLabelText('Email');
      expect(input).toHaveClass('custom-class');
      expect(input).toHaveClass('h-10'); // Base class still applied
    });
  });

  describe('accessibility', () => {
    it('associates label with input using htmlFor', () => {
      render(<FormField label="Email" value="" onChange={vi.fn()} id="email-input" />);
      const label = screen.getByText(/Email/);
      const input = screen.getByLabelText('Email');
      expect(label).toHaveAttribute('for', 'email-input');
      expect(input).toHaveAttribute('id', 'email-input');
    });

    it('displays error message with proper styling', () => {
      render(<FormField label="Email" value="" onChange={vi.fn()} error="Invalid email format" />);
      const error = screen.getByText('Invalid email format');
      expect(error).toHaveClass('text-xs', 'text-red-400');
    });
  });

  describe('ref forwarding', () => {
    it('forwards ref correctly', () => {
      const ref = createRef<HTMLInputElement>();
      render(<FormField ref={ref} label="Email" value="" onChange={vi.fn()} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });
  });

  describe('HTML attributes', () => {
    it('passes through type attribute', () => {
      render(<FormField label="Password" value="" onChange={vi.fn()} type="password" id="pwd" />);
      const input = screen.getByLabelText(/Password/);
      expect(input).toHaveAttribute('type', 'password');
    });

    it('passes through placeholder', () => {
      render(
        <FormField label="Email" value="" onChange={vi.fn()} placeholder="user@example.com" />
      );
      expect(screen.getByPlaceholderText('user@example.com')).toBeInTheDocument();
    });

    it('passes through additional HTML attributes', () => {
      render(
        <FormField
          label="Email"
          value=""
          onChange={vi.fn()}
          data-testid="email-field"
          aria-describedby="email-hint"
        />
      );
      const input = screen.getByTestId('email-field');
      expect(input).toHaveAttribute('aria-describedby', 'email-hint');
    });
  });
});
