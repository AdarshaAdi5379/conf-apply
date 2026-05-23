import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../src/context/AuthContext';

vi.mock('../src/services/api', () => {
  const mockUser = { _id: 'user-1', name: 'Test User', email: 'test@example.com', role: 'candidate' };

  return {
    authAPI: {
      login: vi.fn().mockResolvedValue({
        data: {
          data: {
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
            user: mockUser,
          },
        },
      }),
      register: vi.fn().mockResolvedValue({
        data: {
          data: {
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
            user: mockUser,
          },
        },
      }),
      getCurrentUser: vi.fn().mockResolvedValue({
        data: { data: { ...mockUser } },
      }),
    },
  };
});

const TestComponent = () => {
  const { user, isAuthenticated, loading, login, register, logout } = useAuth();

  if (loading) return <div data-testid="loading">Loading...</div>;

  return (
    <div>
      <div data-testid="auth-status">
        {isAuthenticated ? `Logged in as ${user.name}` : 'Not logged in'}
      </div>
      <button data-testid="login-btn" onClick={() => login('test@example.com', 'password')}>
        Login
      </button>
      <button data-testid="register-btn" onClick={() => register('New', 'new@example.com', 'password', 'candidate')}>
        Register
      </button>
      <button data-testid="logout-btn" onClick={logout}>Logout</button>
    </div>
  );
};

const renderWithAuth = () =>
  render(
    <MemoryRouter>
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    </MemoryRouter>
  );

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should show loading initially when token exists', () => {
    localStorage.setItem('accessToken', 'existing-token');
    renderWithAuth();
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('should show not logged in when no token', async () => {
    renderWithAuth();
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not logged in');
    });
  });

  it('should login successfully', async () => {
    const user = userEvent.setup();
    renderWithAuth();

    await waitFor(() => expect(screen.getByTestId('auth-status')).toBeInTheDocument());

    await user.click(screen.getByTestId('login-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Logged in as Test User');
    });
  });

  it('should register successfully', async () => {
    const user = userEvent.setup();
    renderWithAuth();

    await waitFor(() => expect(screen.getByTestId('auth-status')).toBeInTheDocument());

    await user.click(screen.getByTestId('register-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Logged in as Test User');
    });
  });

  it('should logout and clear state', async () => {
    const user = userEvent.setup();
    renderWithAuth();

    await waitFor(() => expect(screen.getByTestId('auth-status')).toBeInTheDocument());

    await user.click(screen.getByTestId('login-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Logged in');
    });

    await user.click(screen.getByTestId('logout-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not logged in');
    });
  });

  it('should store tokens in localStorage on login', async () => {
    const user = userEvent.setup();
    renderWithAuth();

    await waitFor(() => expect(screen.getByTestId('auth-status')).toBeInTheDocument());
    await user.click(screen.getByTestId('login-btn'));

    await waitFor(() => {
      expect(localStorage.getItem('accessToken')).toBe('mock-access-token');
      expect(localStorage.getItem('refreshToken')).toBe('mock-refresh-token');
    });
  });

  it('should clear tokens from localStorage on logout', async () => {
    localStorage.setItem('accessToken', 'mock-token');
    localStorage.setItem('refreshToken', 'mock-refresh');

    const { unmount } = renderWithAuth();
    const user = userEvent.setup();

    await waitFor(() => expect(screen.getByTestId('auth-status')).toBeInTheDocument());

    await user.click(screen.getByTestId('logout-btn'));

    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
  });
});
