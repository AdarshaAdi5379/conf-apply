import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProtectedRoute from '../src/components/ProtectedRoute.jsx';

vi.mock('../src/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    Navigate: ({ to }) => <div data-testid="navigate" data-to={to}>Redirecting to {to}</div>,
  };
}));

import { useAuth } from '../src/context/AuthContext';

const renderProtected = (children, authValue, roles = []) => {
  useAuth.mockReturnValue(authValue);
  return render(
    <BrowserRouter>
      <ProtectedRoute roles={roles}>
        {children}
      </ProtectedRoute>
    </BrowserRouter>
  );
};

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading spinner when loading', () => {
    renderProtected(<div>Content</div>, { user: null, loading: true });
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should redirect to login when not authenticated', () => {
    renderProtected(<div>Content</div>, { user: null, loading: false });
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/login');
  });

  it('should render children when authenticated', () => {
    renderProtected(<div data-testid="content">Content</div>, { user: { role: 'candidate' }, loading: false });
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('should redirect to dashboard when user lacks required role', () => {
    renderProtected(
      <div>Content</div>,
      { user: { role: 'candidate' }, loading: false },
      ['admin']
    );
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/dashboard');
  });

  it('should render children when user has required role', () => {
    renderProtected(
      <div data-testid="content">Content</div>,
      { user: { role: 'admin' }, loading: false },
      ['admin']
    );
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('should render children when no roles required', () => {
    renderProtected(
      <div data-testid="content">Content</div>,
      { user: { role: 'candidate' }, loading: false },
      []
    );
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });
});
