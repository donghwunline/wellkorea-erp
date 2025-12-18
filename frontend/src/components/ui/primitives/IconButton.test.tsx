import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IconButton } from './IconButton';

const TestIcon = () => (
  <svg className="h-4 w-4" data-testid="test-icon">
    <path d="M0 0" />
  </svg>
);

describe('IconButton', () => {
  it('renders with aria-label', () => {
    render(
      <IconButton aria-label="Delete item">
        <TestIcon />
      </IconButton>
    );
    expect(screen.getByLabelText('Delete item')).toBeInTheDocument();
  });

  it('renders icon children', () => {
    render(
      <IconButton aria-label="Test">
        <TestIcon />
      </IconButton>
    );
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('applies ghost variant by default', () => {
    const { container } = render(
      <IconButton aria-label="Test">
        <TestIcon />
      </IconButton>
    );
    const button = container.firstChild as HTMLElement;
    expect(button).toHaveClass('text-steel-400');
    expect(button).toHaveClass('hover:bg-steel-800');
  });

  it('applies danger variant styles', () => {
    const { container } = render(
      <IconButton variant="danger" aria-label="Delete">
        <TestIcon />
      </IconButton>
    );
    const button = container.firstChild as HTMLElement;
    expect(button).toHaveClass('text-red-400');
    expect(button).toHaveClass('hover:bg-red-500/10');
  });

  it('applies primary variant styles', () => {
    const { container } = render(
      <IconButton variant="primary" aria-label="Edit">
        <TestIcon />
      </IconButton>
    );
    const button = container.firstChild as HTMLElement;
    expect(button).toHaveClass('text-copper-400');
    expect(button).toHaveClass('hover:bg-copper-500/10');
  });

  it('handles click events', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(
      <IconButton onClick={handleClick} aria-label="Click me">
        <TestIcon />
      </IconButton>
    );
    await user.click(screen.getByLabelText('Click me'));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('can be disabled', () => {
    render(
      <IconButton disabled aria-label="Disabled">
        <TestIcon />
      </IconButton>
    );
    const button = screen.getByLabelText('Disabled');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('disabled:opacity-50');
  });

  it('merges custom className', () => {
    const { container } = render(
      <IconButton className="custom-class" aria-label="Test">
        <TestIcon />
      </IconButton>
    );
    const button = container.firstChild as HTMLElement;
    expect(button).toHaveClass('custom-class');
    expect(button).toHaveClass('rounded-lg');
  });

  it('forwards ref correctly', () => {
    const ref = { current: null as HTMLButtonElement | null };
    render(
      <IconButton ref={ref} aria-label="Test">
        <TestIcon />
      </IconButton>
    );
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('defaults to type="button"', () => {
    render(
      <IconButton aria-label="Test">
        <TestIcon />
      </IconButton>
    );
    expect(screen.getByLabelText('Test')).toHaveAttribute('type', 'button');
  });

  it('allows type override', () => {
    render(
      <IconButton type="submit" aria-label="Submit">
        <TestIcon />
      </IconButton>
    );
    expect(screen.getByLabelText('Submit')).toHaveAttribute('type', 'submit');
  });

  it('passes through additional HTML attributes', () => {
    render(
      <IconButton data-testid="custom-button" title="Tooltip" aria-label="Test">
        <TestIcon />
      </IconButton>
    );
    const button = screen.getByTestId('custom-button');
    expect(button).toHaveAttribute('title', 'Tooltip');
  });
});
