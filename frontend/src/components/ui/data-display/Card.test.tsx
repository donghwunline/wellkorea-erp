import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from './Card';

describe('Card', () => {
  it('renders children correctly', () => {
    render(<Card>Test Content</Card>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('applies default variant styles by default', () => {
    const { container } = render(<Card>Content</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('rounded-xl');
    expect(card).toHaveClass('border');
    expect(card).toHaveClass('p-6');
  });

  it('applies table variant styles', () => {
    const { container } = render(<Card variant="table">Content</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('overflow-hidden');
    expect(card).not.toHaveClass('p-6');
  });

  it('applies interactive variant with hover and cursor', () => {
    const { container } = render(<Card variant="interactive">Content</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('hover:bg-steel-800/50');
    expect(card).toHaveClass('cursor-pointer');
  });

  it('applies stat variant with reduced padding', () => {
    const { container } = render(<Card variant="stat">Content</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('p-4');
  });

  it('merges custom className with variant styles', () => {
    const { container } = render(
      <Card className="custom-class">Content</Card>,
    );
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('custom-class');
    expect(card).toHaveClass('rounded-xl');
  });

  it('forwards ref correctly', () => {
    const ref = { current: null as HTMLDivElement | null };
    render(<Card ref={ref}>Content</Card>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('passes through additional HTML attributes', () => {
    render(
      <Card data-testid="custom-card" aria-label="Test Card">
        Content
      </Card>,
    );
    const card = screen.getByTestId('custom-card');
    expect(card).toHaveAttribute('aria-label', 'Test Card');
  });
});
