import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('renders default variant with default message', () => {
    render(<EmptyState />);
    expect(screen.getByText('No data found')).toBeInTheDocument();
  });

  it('renders with custom message', () => {
    render(<EmptyState message="No users found" />);
    expect(screen.getByText('No users found')).toBeInTheDocument();
  });

  it('renders with description', () => {
    render(<EmptyState message="Empty" description="Try adding some items" />);
    expect(screen.getByText('Empty')).toBeInTheDocument();
    expect(screen.getByText('Try adding some items')).toBeInTheDocument();
  });

  it('renders with icon', () => {
    render(<EmptyState message="Empty" icon={<span data-testid="custom-icon">📦</span>} />);
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('renders with action button', () => {
    render(<EmptyState message="Empty" action={<button>Add Item</button>} />);
    expect(screen.getByRole('button', { name: 'Add Item' })).toBeInTheDocument();
  });

  it('renders table variant with colspan', () => {
    const { container } = render(
      <table>
        <tbody>
          <EmptyState variant="table" colspan={5} />
        </tbody>
      </table>
    );
    const td = container.querySelector('td');
    expect(td).toHaveAttribute('colSpan', '5');
  });

  it('renders table variant with all props', () => {
    render(
      <table>
        <tbody>
          <EmptyState
            variant="table"
            message="No results"
            description="Try adjusting filters"
            icon={<span data-testid="table-icon">🔍</span>}
            action={<button>Clear Filters</button>}
          />
        </tbody>
      </table>
    );
    expect(screen.getByText('No results')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting filters')).toBeInTheDocument();
    expect(screen.getByTestId('table-icon')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear Filters' })).toBeInTheDocument();
  });

  it('applies custom className for default variant', () => {
    const { container } = render(<EmptyState className="custom-class" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('custom-class');
    expect(wrapper).toHaveClass('flex');
  });

  it('applies custom className for table variant', () => {
    const { container } = render(
      <table>
        <tbody>
          <EmptyState variant="table" className="custom-table-class" />
        </tbody>
      </table>
    );
    const td = container.querySelector('td');
    expect(td).toHaveClass('custom-table-class');
  });

  it('passes through additional HTML attributes', () => {
    render(<EmptyState data-testid="empty-state" aria-label="No content" />);
    const element = screen.getByTestId('empty-state');
    expect(element).toHaveAttribute('aria-label', 'No content');
  });
});
