/**
 * Tests for Input component
 */

import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Input } from './Input';

describe('Input', () => {
  describe('rendering', () => {
    it('should render an input element', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });

    it('should render with placeholder', () => {
      render(<Input placeholder="Enter email" />);
      expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<Input className="custom-class" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('custom-class');
    });
  });

  describe('label', () => {
    it('should render label when provided', () => {
      render(<Input label="Email" />);
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });

    it('should connect label to input with htmlFor and id', () => {
      render(<Input label="Email" />);
      const label = screen.getByText('Email');
      const input = screen.getByLabelText('Email');

      expect(label).toHaveAttribute('for', 'email');
      expect(input).toHaveAttribute('id', 'email');
    });

    it('should use custom id if provided', () => {
      render(<Input label="Email" id="custom-email" />);
      const label = screen.getByText('Email');
      const input = screen.getByLabelText('Email');

      expect(label).toHaveAttribute('for', 'custom-email');
      expect(input).toHaveAttribute('id', 'custom-email');
    });

    it('should generate id from label by converting to lowercase and replacing spaces', () => {
      render(<Input label="User Name" />);
      const input = screen.getByLabelText('User Name');

      expect(input).toHaveAttribute('id', 'user-name');
    });
  });

  describe('error state', () => {
    it('should render error message when provided', () => {
      render(<Input label="Email" error="Required field" />);
      expect(screen.getByText('Required field')).toBeInTheDocument();
    });

    it('should apply error styling to input', () => {
      render(<Input label="Email" error="Required field" />);
      const input = screen.getByLabelText('Email');

      expect(input).toHaveClass('border-red-500');
    });

    it('should have aria-invalid when error exists', () => {
      render(<Input label="Email" error="Required field" />);
      const input = screen.getByLabelText('Email');

      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('should link error message with aria-describedby', () => {
      render(<Input label="Email" error="Required field" />);
      const input = screen.getByLabelText('Email');
      const errorMsg = screen.getByText('Required field');

      expect(input).toHaveAttribute('aria-describedby', 'email-error');
      expect(errorMsg).toHaveAttribute('id', 'email-error');
    });

    it('should have role="alert" on error message', () => {
      render(<Input label="Email" error="Required field" />);
      const errorMsg = screen.getByText('Required field');

      expect(errorMsg).toHaveAttribute('role', 'alert');
    });

    it('should not have aria-invalid when no error', () => {
      render(<Input label="Email" />);
      const input = screen.getByLabelText('Email');

      expect(input).not.toHaveAttribute('aria-invalid');
    });

    it('should not have aria-describedby when no error', () => {
      render(<Input label="Email" />);
      const input = screen.getByLabelText('Email');

      expect(input).not.toHaveAttribute('aria-describedby');
    });
  });

  describe('disabled state', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Input label="Email" disabled />);
      const input = screen.getByLabelText('Email');

      expect(input).toBeDisabled();
    });

    it('should apply disabled styling', () => {
      render(<Input label="Email" disabled />);
      const input = screen.getByLabelText('Email');

      expect(input).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50');
    });
  });

  describe('user interaction', () => {
    it('should accept user input', async () => {
      const user = userEvent.setup();
      render(<Input label="Email" />);
      const input = screen.getByLabelText('Email') as HTMLInputElement;

      await user.type(input, 'test@example.com');

      expect(input.value).toBe('test@example.com');
    });

    it('should call onChange handler', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(<Input label="Email" onChange={handleChange} />);
      const input = screen.getByLabelText('Email');

      await user.type(input, 'a');

      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe('ref forwarding', () => {
    it('should forward ref to input element', () => {
      const ref = React.createRef<HTMLInputElement>();

      render(<Input ref={ref} label="Email" />);

      expect(ref.current).toBeInstanceOf(HTMLInputElement);
      expect(ref.current?.tagName).toBe('INPUT');
    });

    it('should allow focus via ref', () => {
      const ref = React.createRef<HTMLInputElement>();

      render(<Input ref={ref} label="Email" />);

      ref.current?.focus();

      expect(ref.current).toHaveFocus();
    });
  });

  describe('input types', () => {
    it('should support different input types', () => {
      const { rerender } = render(<Input type="text" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'text');

      rerender(<Input type="email" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');

      rerender(<Input type="password" />);
      const passwordInput = document.querySelector('input[type="password"]');
      expect(passwordInput).toBeInTheDocument();
    });
  });

  describe('additional attributes', () => {
    it('should pass through standard input attributes', () => {
      render(
        <Input label="Email" required maxLength={50} autoComplete="email" name="user-email" />,
      );

      const input = screen.getByLabelText('Email');

      expect(input).toBeRequired();
      expect(input).toHaveAttribute('maxLength', '50');
      expect(input).toHaveAttribute('autoComplete', 'email');
      expect(input).toHaveAttribute('name', 'user-email');
    });
  });
});
