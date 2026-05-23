import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from '../src/components/Navbar';

vi.mock('../src/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('lucide-react', () => ({
  Shield: () => null,
  Menu: () => null,
  X: () => null,
  ChevronDown: () => null,
  LogOut: () => null,
  User: () => null,
  LogIn: () => null,
  UserPlus: () => null,
  Briefcase: () => null,
  LayoutDashboard: () => null,
  FileText: () => null,
  Settings: () => null,
  ShieldAlert: () => null,
}));

import { useAuth } from '../src/context/AuthContext';

const renderNavbar = () =>
  render(
    <MemoryRouter>
      <Navbar />
    </MemoryRouter>
  );

describe('Navbar', () => {
  it('should render brand name', () => {
    useAuth.mockReturnValue({ user: null, loading: false, logout: vi.fn() });
    renderNavbar();
    expect(screen.getByText('RecruiterRisk')).toBeInTheDocument();
  });

  it('should show login/register links when not authenticated', () => {
    useAuth.mockReturnValue({ user: null, loading: false, logout: vi.fn() });
    renderNavbar();
    expect(screen.getByText(/Login/i)).toBeInTheDocument();
    expect(screen.getByText(/Register/i)).toBeInTheDocument();
  });

  it('should show dashboard link when authenticated as candidate', () => {
    useAuth.mockReturnValue({
      user: { name: 'Test', role: 'candidate' },
      loading: false,
      logout: vi.fn(),
      isAuthenticated: true,
    });
    renderNavbar();
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
  });

  it('should show user name when authenticated', () => {
    useAuth.mockReturnValue({
      user: { name: 'John Doe', role: 'candidate' },
      loading: false,
      logout: vi.fn(),
      isAuthenticated: true,
    });
    renderNavbar();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('should show Browse Jobs link for all users', () => {
    useAuth.mockReturnValue({ user: null, loading: false, logout: vi.fn() });
    renderNavbar();
    expect(screen.getByText(/Browse Jobs/i)).toBeInTheDocument();
  });
});
