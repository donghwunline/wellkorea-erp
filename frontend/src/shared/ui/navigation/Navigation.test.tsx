import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactElement } from 'react';
import { Navigation } from './Navigation';

/**
 * Helper to wrap component with MemoryRouter for testing
 */
function renderWithRouter(ui: ReactElement, pathname = '/') {
  return render(<MemoryRouter initialEntries={[pathname]}>{ui}</MemoryRouter>);
}

// ============================================================================
// Navigation (Root Component)
// ============================================================================

describe('Navigation', () => {
  it('renders children correctly', () => {
    renderWithRouter(
      <Navigation collapsed={false}>
        <div>Navigation Content</div>
      </Navigation>
    );
    expect(screen.getByText('Navigation Content')).toBeInTheDocument();
  });

  it('renders as nav element', () => {
    renderWithRouter(
      <Navigation collapsed={false}>
        <div>Content</div>
      </Navigation>
    );
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('applies base styling classes', () => {
    const { container } = renderWithRouter(
      <Navigation collapsed={false}>
        <div>Content</div>
      </Navigation>
    );
    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('flex-1');
    expect(nav).toHaveClass('overflow-y-auto');
    expect(nav).toHaveClass('p-3');
  });

  it('merges custom className', () => {
    const { container } = renderWithRouter(
      <Navigation collapsed={false} className="custom-nav">
        <div>Content</div>
      </Navigation>
    );
    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('custom-nav');
    expect(nav).toHaveClass('flex-1');
  });

  it('passes through HTML attributes', () => {
    renderWithRouter(
      <Navigation collapsed={false} data-testid="main-nav" aria-label="Main navigation">
        <div>Content</div>
      </Navigation>
    );
    const nav = screen.getByTestId('main-nav');
    expect(nav).toHaveAttribute('aria-label', 'Main navigation');
  });

  it('provides context to sub-components with collapsed=false', () => {
    renderWithRouter(
      <Navigation collapsed={false}>
        <Navigation.Section title="Test Section">
          <Navigation.Link to="/test" icon="home">
            Test Link
          </Navigation.Link>
        </Navigation.Section>
      </Navigation>
    );
    // When not collapsed, section title and link label should be visible
    expect(screen.getByText('Test Section')).toBeInTheDocument();
    expect(screen.getByText('Test Link')).toBeInTheDocument();
  });

  it('provides context to sub-components with collapsed=true', () => {
    renderWithRouter(
      <Navigation collapsed={true}>
        <Navigation.Section title="Test Section">
          <Navigation.Link to="/test" icon="home">
            Test Link
          </Navigation.Link>
        </Navigation.Section>
      </Navigation>
    );
    // When collapsed, section title and link label should NOT be visible
    expect(screen.queryByText('Test Section')).not.toBeInTheDocument();
    expect(screen.queryByText('Test Link')).not.toBeInTheDocument();
  });

  it('accepts pathname override for testing', () => {
    renderWithRouter(
      <Navigation collapsed={false} pathname="/projects">
        <Navigation.Section title="Test">
          <Navigation.Link to="/projects" icon="clipboard">
            Projects
          </Navigation.Link>
        </Navigation.Section>
      </Navigation>,
      '/' // MemoryRouter at root, but pathname override is /projects
    );
    // Link should be active because of pathname override
    const link = screen.getByRole('link', { name: /projects/i });
    expect(link).toHaveClass('bg-copper-500/10');
    expect(link).toHaveClass('text-copper-400');
  });
});

// ============================================================================
// Navigation.Section
// ============================================================================

describe('Navigation.Section', () => {
  it('renders title when not collapsed', () => {
    renderWithRouter(
      <Navigation collapsed={false}>
        <Navigation.Section title="Operations">
          <div>Section Content</div>
        </Navigation.Section>
      </Navigation>
    );
    expect(screen.getByText('Operations')).toBeInTheDocument();
  });

  it('hides title when collapsed', () => {
    renderWithRouter(
      <Navigation collapsed={true}>
        <Navigation.Section title="Operations">
          <div>Section Content</div>
        </Navigation.Section>
      </Navigation>
    );
    expect(screen.queryByText('Operations')).not.toBeInTheDocument();
  });

  it('renders divider when showDivider is true', () => {
    const { container } = renderWithRouter(
      <Navigation collapsed={false}>
        <Navigation.Section title="Admin" showDivider>
          <div>Content</div>
        </Navigation.Section>
      </Navigation>
    );
    const divider = container.querySelector('.border-t');
    expect(divider).toBeInTheDocument();
    expect(divider).toHaveClass('border-steel-800/50');
  });

  it('does not render divider when showDivider is false (default)', () => {
    const { container } = renderWithRouter(
      <Navigation collapsed={false}>
        <Navigation.Section title="Operations">
          <div>Content</div>
        </Navigation.Section>
      </Navigation>
    );
    const divider = container.querySelector('.border-t');
    expect(divider).not.toBeInTheDocument();
  });

  it('renders children in ul element', () => {
    renderWithRouter(
      <Navigation collapsed={false}>
        <Navigation.Section title="Test">
          <li>Item 1</li>
          <li>Item 2</li>
        </Navigation.Section>
      </Navigation>
    );
    const list = screen.getByRole('list');
    expect(list).toBeInTheDocument();
    expect(list.tagName).toBe('UL');
    expect(list).toHaveClass('space-y-1');
  });

  it('applies correct title styling', () => {
    renderWithRouter(
      <Navigation collapsed={false}>
        <Navigation.Section title="Master Data">
          <div>Content</div>
        </Navigation.Section>
      </Navigation>
    );
    const title = screen.getByText('Master Data');
    expect(title.tagName).toBe('P');
    expect(title).toHaveClass('text-xs');
    expect(title).toHaveClass('font-semibold');
    expect(title).toHaveClass('uppercase');
    expect(title).toHaveClass('text-steel-500');
  });

  it('throws error when used outside Navigation context', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(
        <MemoryRouter>
          <Navigation.Section title="Test">
            <div>Content</div>
          </Navigation.Section>
        </MemoryRouter>
      );
    }).toThrow('Navigation sub-components must be used within <Navigation>');

    consoleSpy.mockRestore();
  });
});

// ============================================================================
// Navigation.Link
// ============================================================================

describe('Navigation.Link', () => {
  it('renders link with correct path', () => {
    renderWithRouter(
      <Navigation collapsed={false}>
        <Navigation.Section title="Test">
          <Navigation.Link to="/projects" icon="clipboard">
            Projects
          </Navigation.Link>
        </Navigation.Section>
      </Navigation>
    );
    const link = screen.getByRole('link', { name: /projects/i });
    expect(link).toHaveAttribute('href', '/projects');
  });

  it('renders icon', () => {
    const { container } = renderWithRouter(
      <Navigation collapsed={false}>
        <Navigation.Section title="Test">
          <Navigation.Link to="/test" icon="home">
            Test
          </Navigation.Link>
        </Navigation.Section>
      </Navigation>
    );
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('h-5');
    expect(svg).toHaveClass('w-5');
  });

  it('renders label when not collapsed', () => {
    renderWithRouter(
      <Navigation collapsed={false}>
        <Navigation.Section title="Test">
          <Navigation.Link to="/dashboard" icon="home">
            Dashboard
          </Navigation.Link>
        </Navigation.Section>
      </Navigation>
    );
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('hides label when collapsed', () => {
    renderWithRouter(
      <Navigation collapsed={true}>
        <Navigation.Section title="Test">
          <Navigation.Link to="/dashboard" icon="home">
            Dashboard
          </Navigation.Link>
        </Navigation.Section>
      </Navigation>
    );
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  it('shows tooltip (title) when collapsed', () => {
    renderWithRouter(
      <Navigation collapsed={true}>
        <Navigation.Section title="Test">
          <Navigation.Link to="/dashboard" icon="home">
            Dashboard
          </Navigation.Link>
        </Navigation.Section>
      </Navigation>
    );
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('title', 'Dashboard');
  });

  it('does not show tooltip when not collapsed', () => {
    renderWithRouter(
      <Navigation collapsed={false}>
        <Navigation.Section title="Test">
          <Navigation.Link to="/dashboard" icon="home">
            Dashboard
          </Navigation.Link>
        </Navigation.Section>
      </Navigation>
    );
    const link = screen.getByRole('link', { name: /dashboard/i });
    expect(link).not.toHaveAttribute('title');
  });

  it('applies active styles when path matches exactly', () => {
    renderWithRouter(
      <Navigation collapsed={false} pathname="/projects">
        <Navigation.Section title="Test">
          <Navigation.Link to="/projects" icon="clipboard" exact>
            Projects
          </Navigation.Link>
        </Navigation.Section>
      </Navigation>
    );
    const link = screen.getByRole('link', { name: /projects/i });
    expect(link).toHaveClass('bg-copper-500/10');
    expect(link).toHaveClass('text-copper-400');
  });

  it('applies active styles when path matches with prefix (default)', () => {
    renderWithRouter(
      <Navigation collapsed={false} pathname="/projects/123">
        <Navigation.Section title="Test">
          <Navigation.Link to="/projects" icon="clipboard">
            Projects
          </Navigation.Link>
        </Navigation.Section>
      </Navigation>
    );
    const link = screen.getByRole('link', { name: /projects/i });
    expect(link).toHaveClass('bg-copper-500/10');
    expect(link).toHaveClass('text-copper-400');
  });

  it('applies inactive styles when path does not match', () => {
    renderWithRouter(
      <Navigation collapsed={false} pathname="/other">
        <Navigation.Section title="Test">
          <Navigation.Link to="/projects" icon="clipboard">
            Projects
          </Navigation.Link>
        </Navigation.Section>
      </Navigation>
    );
    const link = screen.getByRole('link', { name: /projects/i });
    expect(link).toHaveClass('text-steel-400');
    expect(link).not.toHaveClass('bg-copper-500/10');
  });

  it('handles root path "/" with exact matching always', () => {
    renderWithRouter(
      <Navigation collapsed={false} pathname="/projects">
        <Navigation.Section title="Test">
          <Navigation.Link to="/" icon="home">
            Dashboard
          </Navigation.Link>
        </Navigation.Section>
      </Navigation>
    );
    // Root path should NOT be active when on /projects
    const link = screen.getByRole('link', { name: /dashboard/i });
    expect(link).toHaveClass('text-steel-400');
    expect(link).not.toHaveClass('bg-copper-500/10');
  });

  it('throws error when used outside Navigation context', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(
        <MemoryRouter>
          <Navigation.Link to="/test" icon="home">
            Test
          </Navigation.Link>
        </MemoryRouter>
      );
    }).toThrow('Navigation sub-components must be used within <Navigation>');

    consoleSpy.mockRestore();
  });
});

// ============================================================================
// Navigation compound usage
// ============================================================================

describe('Navigation compound usage', () => {
  it('works with multiple sections', () => {
    renderWithRouter(
      <Navigation collapsed={false}>
        <Navigation.Section title="Operations">
          <Navigation.Link to="/" icon="home" exact>
            Dashboard
          </Navigation.Link>
          <Navigation.Link to="/projects" icon="clipboard">
            Projects
          </Navigation.Link>
        </Navigation.Section>
        <Navigation.Section title="Admin" showDivider>
          <Navigation.Link to="/admin/users" icon="users">
            Users
          </Navigation.Link>
        </Navigation.Section>
      </Navigation>
    );

    expect(screen.getByText('Operations')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /projects/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /users/i })).toBeInTheDocument();
  });

  it('updates active state based on pathname', () => {
    const { rerender } = renderWithRouter(
      <Navigation collapsed={false} pathname="/">
        <Navigation.Section title="Test">
          <Navigation.Link to="/" icon="home" exact>
            Dashboard
          </Navigation.Link>
          <Navigation.Link to="/projects" icon="clipboard">
            Projects
          </Navigation.Link>
        </Navigation.Section>
      </Navigation>
    );

    // Initially at root - Dashboard should be active
    let dashboard = screen.getByRole('link', { name: /dashboard/i });
    let projects = screen.getByRole('link', { name: /projects/i });
    expect(dashboard).toHaveClass('text-copper-400');
    expect(projects).toHaveClass('text-steel-400');

    // Change to /projects - Projects should be active
    rerender(
      <MemoryRouter initialEntries={['/']}>
        <Navigation collapsed={false} pathname="/projects">
          <Navigation.Section title="Test">
            <Navigation.Link to="/" icon="home" exact>
              Dashboard
            </Navigation.Link>
            <Navigation.Link to="/projects" icon="clipboard">
              Projects
            </Navigation.Link>
          </Navigation.Section>
        </Navigation>
      </MemoryRouter>
    );

    dashboard = screen.getByRole('link', { name: /dashboard/i });
    projects = screen.getByRole('link', { name: /projects/i });
    expect(dashboard).toHaveClass('text-steel-400');
    expect(projects).toHaveClass('text-copper-400');
  });

  it('works with conditional sections', () => {
    const hasAdminAccess = false;

    renderWithRouter(
      <Navigation collapsed={false}>
        <Navigation.Section title="Operations">
          <Navigation.Link to="/" icon="home" exact>
            Dashboard
          </Navigation.Link>
        </Navigation.Section>
        {hasAdminAccess && (
          <Navigation.Section title="Admin" showDivider>
            <Navigation.Link to="/admin" icon="users">
              Admin
            </Navigation.Link>
          </Navigation.Section>
        )}
      </Navigation>
    );

    expect(screen.getByText('Operations')).toBeInTheDocument();
    expect(screen.queryByText('Admin')).not.toBeInTheDocument();
  });
});
