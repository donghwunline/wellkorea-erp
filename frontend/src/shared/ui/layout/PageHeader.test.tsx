import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageHeader } from './PageHeader';

describe('PageHeader', () => {
  it('renders children correctly', () => {
    render(
      <PageHeader>
        <div>Header Content</div>
      </PageHeader>
    );
    expect(screen.getByText('Header Content')).toBeInTheDocument();
  });

  it('applies flex layout with spacing', () => {
    const { container } = render(
      <PageHeader>
        <div>Content</div>
      </PageHeader>
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('flex');
    expect(wrapper).toHaveClass('items-center');
    expect(wrapper).toHaveClass('justify-between');
    expect(wrapper).toHaveClass('mb-6');
  });

  it('merges custom className', () => {
    const { container } = render(
      <PageHeader className="custom-class">
        <div>Content</div>
      </PageHeader>
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('custom-class');
    expect(wrapper).toHaveClass('flex');
  });

  it('passes through additional HTML attributes', () => {
    render(
      <PageHeader data-testid="page-header" aria-label="Page Header">
        <div>Content</div>
      </PageHeader>
    );
    const element = screen.getByTestId('page-header');
    expect(element).toHaveAttribute('aria-label', 'Page Header');
  });
});

describe('PageHeader.Title', () => {
  it('renders title', () => {
    render(<PageHeader.Title title="User Management" />);
    expect(screen.getByRole('heading', { name: 'User Management' })).toBeInTheDocument();
  });

  it('renders title with description', () => {
    render(<PageHeader.Title title="Settings" description="Manage your account settings" />);
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByText('Manage your account settings')).toBeInTheDocument();
  });

  it('renders without description', () => {
    render(<PageHeader.Title title="Dashboard" />);
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.queryByText(/manage/i)).not.toBeInTheDocument();
  });

  it('applies heading styling to title', () => {
    render(<PageHeader.Title title="Test Title" />);
    const heading = screen.getByRole('heading');
    expect(heading).toHaveClass('text-2xl');
    expect(heading).toHaveClass('font-bold');
    expect(heading).toHaveClass('text-white');
  });

  it('applies description styling', () => {
    const { container } = render(<PageHeader.Title title="Test" description="Test description" />);
    const description = container.querySelector('p');
    expect(description).toHaveClass('text-sm');
    expect(description).toHaveClass('text-steel-400');
  });

  it('merges custom className', () => {
    const { container } = render(<PageHeader.Title title="Test" className="custom-title" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('custom-title');
    expect(wrapper).toHaveClass('flex-1');
  });
});

describe('PageHeader.Actions', () => {
  it('renders action buttons', () => {
    render(
      <PageHeader.Actions>
        <button>Create</button>
        <button>Export</button>
      </PageHeader.Actions>
    );
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument();
  });

  it('applies flex layout with gap', () => {
    const { container } = render(
      <PageHeader.Actions>
        <button>Action</button>
      </PageHeader.Actions>
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('flex');
    expect(wrapper).toHaveClass('items-center');
    expect(wrapper).toHaveClass('gap-3');
  });

  it('merges custom className', () => {
    const { container } = render(
      <PageHeader.Actions className="custom-actions">
        <button>Action</button>
      </PageHeader.Actions>
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('custom-actions');
    expect(wrapper).toHaveClass('flex');
  });
});

describe('PageHeader compound usage', () => {
  it('works with Title and Actions together', () => {
    render(
      <PageHeader>
        <PageHeader.Title title="Users" description="Manage system users" />
        <PageHeader.Actions>
          <button>Add User</button>
        </PageHeader.Actions>
      </PageHeader>
    );

    expect(screen.getByRole('heading', { name: 'Users' })).toBeInTheDocument();
    expect(screen.getByText('Manage system users')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add User' })).toBeInTheDocument();
  });

  it('works with Title only', () => {
    render(
      <PageHeader>
        <PageHeader.Title title="Dashboard" />
      </PageHeader>
    );

    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
  });

  it('works with Actions only', () => {
    render(
      <PageHeader>
        <PageHeader.Actions>
          <button>Refresh</button>
        </PageHeader.Actions>
      </PageHeader>
    );

    expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument();
  });
});
