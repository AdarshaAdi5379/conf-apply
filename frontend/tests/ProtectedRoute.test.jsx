import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../src/components/ProtectedRoute.jsx';
import { useAuth } from '../src/context/AuthContext';

vi.mock('../src/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const renderProtected = ({ authValue, roles = [] }) => {
  useAuth.mockReturnValue(authValue);

  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route path="/login" element={<div data-testid="login">Login</div>} />
        <Route path="/dashboard" element={<div data-testid="dashboard">Dashboard</div>} />
        <Route
          path="/protected"
          element={
            <ProtectedRoute roles={roles}>
              <div data-testid="content">Content</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );
};

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading spinner when loading', () => {
    renderProtected({ authValue: { user: null, loading: true } });
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should redirect to login when not authenticated', () => {
    renderProtected({ authValue: { user: null, loading: false } });
    expect(screen.getByTestId('login')).toBeInTheDocument();
  });

  it('should render children when authenticated', () => {
    renderProtected({ authValue: { user: { role: 'candidate' }, loading: false } });
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('should redirect to dashboard when user lacks required role', () => {
    renderProtected({ authValue: { user: { role: 'candidate' }, loading: false }, roles: ['admin'] });
    expect(screen.getByTestId('dashboard')).toBeInTheDocument();
  });

  it('should render children when user has required role', () => {
    renderProtected({ authValue: { user: { role: 'admin' }, loading: false }, roles: ['admin'] });
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });
});

