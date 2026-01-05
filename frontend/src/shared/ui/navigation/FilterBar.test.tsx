import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterBar } from './FilterBar';

describe('FilterBar', () => {
  it('renders children correctly', () => {
    render(
      <FilterBar>
        <div>Filter Content</div>
      </FilterBar>
    );
    expect(screen.getByText('Filter Content')).toBeInTheDocument();
  });

  it('applies flex layout classes', () => {
    const { container } = render(
      <FilterBar>
        <div>Content</div>
      </FilterBar>
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('flex');
    expect(wrapper).toHaveClass('flex-wrap');
    expect(wrapper).toHaveClass('gap-4');
  });

  it('merges custom className', () => {
    const { container } = render(
      <FilterBar className="custom-class">
        <div>Content</div>
      </FilterBar>
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('custom-class');
    expect(wrapper).toHaveClass('flex');
  });

  it('passes through additional HTML attributes', () => {
    render(
      <FilterBar data-testid="filter-bar" aria-label="Filters">
        <div>Content</div>
      </FilterBar>
    );
    const element = screen.getByTestId('filter-bar');
    expect(element).toHaveAttribute('aria-label', 'Filters');
  });
});

describe('FilterBar.Field', () => {
  it('renders label and children', () => {
    render(
      <FilterBar.Field label="Status">
        <select>
          <option>Active</option>
        </select>
      </FilterBar.Field>
    );
    expect(screen.getByText('Status')).toBeInTheDocument(); // Label has uppercase CSS class
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('applies uppercase styling to label', () => {
    const { container } = render(
      <FilterBar.Field label="Status">
        <div>Content</div>
      </FilterBar.Field>
    );
    const label = container.querySelector('label');
    expect(label).toHaveClass('uppercase');
    expect(label).toHaveClass('text-steel-500');
  });

  it('merges custom className', () => {
    const { container } = render(
      <FilterBar.Field label="Test" className="custom-field">
        <div>Content</div>
      </FilterBar.Field>
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('custom-field');
    expect(wrapper).toHaveClass('flex-col');
  });
});

describe('FilterBar.Select', () => {
  const mockOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  it('renders with placeholder option', () => {
    render(<FilterBar.Select value="" onValueChange={vi.fn()} options={mockOptions} />);
    expect(screen.getByRole('option', { name: 'All' })).toBeInTheDocument();
  });

  it('renders custom placeholder', () => {
    render(
      <FilterBar.Select
        value=""
        onValueChange={vi.fn()}
        options={mockOptions}
        placeholder="Select status"
      />
    );
    expect(screen.getByRole('option', { name: 'Select status' })).toBeInTheDocument();
  });

  it('renders all options', () => {
    render(<FilterBar.Select value="" onValueChange={vi.fn()} options={mockOptions} />);
    expect(screen.getByRole('option', { name: 'Active' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Inactive' })).toBeInTheDocument();
  });

  it('displays selected value', () => {
    render(<FilterBar.Select value="active" onValueChange={vi.fn()} options={mockOptions} />);
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('active');
  });

  it('calls onValueChange when selection changes', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<FilterBar.Select value="" onValueChange={handleChange} options={mockOptions} />);

    const select = screen.getByRole('combobox');
    await user.selectOptions(select, 'active');
    expect(handleChange).toHaveBeenCalledWith('active');
  });

  it('can be disabled', () => {
    render(<FilterBar.Select value="" onValueChange={vi.fn()} options={mockOptions} disabled />);
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('merges custom className', () => {
    const { container } = render(
      <FilterBar.Select
        value=""
        onValueChange={vi.fn()}
        options={mockOptions}
        className="custom-select"
      />
    );
    const select = container.querySelector('select');
    expect(select).toHaveClass('custom-select');
    expect(select).toHaveClass('rounded-lg');
  });

  it('passes through additional HTML attributes', () => {
    render(
      <FilterBar.Select
        value=""
        onValueChange={vi.fn()}
        options={mockOptions}
        data-testid="filter-select"
        aria-label="Filter"
      />
    );
    const select = screen.getByTestId('filter-select');
    expect(select).toHaveAttribute('aria-label', 'Filter');
  });
});

describe('FilterBar compound usage', () => {
  it('works with FilterBar.Field and FilterBar.Select together', () => {
    const handleChange = vi.fn();
    render(
      <FilterBar>
        <FilterBar.Field label="Status">
          <FilterBar.Select
            value="active"
            onValueChange={handleChange}
            options={[{ value: 'active', label: 'Active' }]}
          />
        </FilterBar.Field>
      </FilterBar>
    );

    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });
});
