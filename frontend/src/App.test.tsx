import {render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';
import App from './App';

describe('App', () => {
  it('renders login page for unauthenticated users', () => {
    render(<App />);
    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.getByText(/Login UI will be implemented in Phase 3/i)).toBeInTheDocument();
  });

  it('renders without crashing', () => {
    const {container} = render(<App />);
    expect(container).toBeInTheDocument();
  });
});
