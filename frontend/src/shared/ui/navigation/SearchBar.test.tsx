import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchBar } from './SearchBar';

describe('SearchBar', () => {
  it('renders with placeholder', () => {
    render(<SearchBar value="" onValueChange={vi.fn()} placeholder="Search users..." />);
    expect(screen.getByPlaceholderText('Search users...')).toBeInTheDocument();
  });

  it('displays current value', () => {
    render(<SearchBar value="test query" onValueChange={vi.fn()} />);
    expect(screen.getByDisplayValue('test query')).toBeInTheDocument();
  });

  it('calls onValueChange when typing', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    const { rerender } = render(<SearchBar value="" onValueChange={handleChange} />);

    const input = screen.getByPlaceholderText('Search...');

    // Type one character at a time and update the controlled component
    await user.type(input, 't');
    rerender(<SearchBar value="t" onValueChange={handleChange} />);
    await user.type(input, 'e');
    rerender(<SearchBar value="te" onValueChange={handleChange} />);
    await user.type(input, 's');
    rerender(<SearchBar value="tes" onValueChange={handleChange} />);
    await user.type(input, 't');

    expect(handleChange).toHaveBeenCalledTimes(4);
    expect(handleChange).toHaveBeenNthCalledWith(1, 't');
    expect(handleChange).toHaveBeenNthCalledWith(2, 'te');
    expect(handleChange).toHaveBeenNthCalledWith(3, 'tes');
    expect(handleChange).toHaveBeenNthCalledWith(4, 'test');
  });

  it('shows clear button when value is not empty', () => {
    render(<SearchBar value="test" onValueChange={vi.fn()} />);
    expect(screen.getByLabelText('Clear search')).toBeInTheDocument();
  });

  it('hides clear button when value is empty', () => {
    render(<SearchBar value="" onValueChange={vi.fn()} />);
    expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();
  });

  it('hides clear button when showClearButton is false', () => {
    render(<SearchBar value="test" onValueChange={vi.fn()} showClearButton={false} />);
    expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();
  });

  it('clears value when clear button is clicked', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<SearchBar value="test" onValueChange={handleChange} />);

    await user.click(screen.getByLabelText('Clear search'));
    expect(handleChange).toHaveBeenCalledWith('');
  });

  it('calls onClear when clear button is clicked', async () => {
    const user = userEvent.setup();
    const handleClear = vi.fn();
    render(<SearchBar value="test" onValueChange={vi.fn()} onClear={handleClear} />);

    await user.click(screen.getByLabelText('Clear search'));
    expect(handleClear).toHaveBeenCalledOnce();
  });

  it('renders search icon', () => {
    const { container } = render(<SearchBar value="" onValueChange={vi.fn()} />);
    const icon = container.querySelector('svg[aria-hidden="true"]');
    expect(icon).toBeInTheDocument();
  });

  it('applies custom className to wrapper', () => {
    const { container } = render(
      <SearchBar value="" onValueChange={vi.fn()} className="custom-class" />
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('custom-class');
    expect(wrapper).toHaveClass('relative');
  });

  it('forwards ref correctly', () => {
    const ref = { current: null as HTMLInputElement | null };
    render(<SearchBar ref={ref} value="" onValueChange={vi.fn()} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('can be disabled', () => {
    render(<SearchBar value="" onValueChange={vi.fn()} disabled />);
    expect(screen.getByPlaceholderText('Search...')).toBeDisabled();
  });

  it('passes through additional HTML attributes', () => {
    render(
      <SearchBar
        value=""
        onValueChange={vi.fn()}
        data-testid="search-input"
        aria-label="Search field"
      />
    );
    const input = screen.getByTestId('search-input');
    expect(input).toHaveAttribute('aria-label', 'Search field');
  });

  it('has type="search"', () => {
    render(<SearchBar value="" onValueChange={vi.fn()} />);
    expect(screen.getByPlaceholderText('Search...')).toHaveAttribute('type', 'search');
  });
});
