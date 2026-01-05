import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

/**
 * Test wrapper that provides router context.
 * Uses MemoryRouter for testing since BrowserRouter is in AppProviders.
 */
function renderWithRouter(initialEntries = ['/login']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <App />
    </MemoryRouter>
  );
}

describe('App', () => {
  it('renders login page for unauthenticated users', () => {
    renderWithRouter(['/login']);
    // Login page should show the WellKorea branding and login form
    expect(screen.getByText('WellKorea')).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('renders without crashing', () => {
    const { container } = renderWithRouter();
    expect(container).toBeInTheDocument();
  });
});
