import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Hero from '../src/components/Hero.jsx';

vi.mock('lucide-react', () => ({
  Shield: () => null,
  CheckCircle: () => null,
  AlertTriangle: () => null,
  TrendingUp: () => null,
}));

const renderHero = () =>
  render(
    <MemoryRouter>
      <Hero />
    </MemoryRouter>
  );

describe('Hero Component', () => {
  it('should render the main heading', () => {
    renderHero();
    expect(screen.getByText(/Recruit Smarter/i)).toBeInTheDocument();
  });

  it('should render the description text', () => {
    renderHero();
    expect(screen.getByText(/Verify recruiter authenticity/i)).toBeInTheDocument();
  });

  it('should render both CTA buttons', () => {
    renderHero();
    expect(screen.getByText('Start Verification')).toBeInTheDocument();
    expect(screen.getByText('View Leaderboard')).toBeInTheDocument();
  });

  it('should have correct link destinations', () => {
    renderHero();
    expect(screen.getByRole('link', { name: /Start Verification/i })).toHaveAttribute('href', '/register');
    expect(screen.getByRole('link', { name: /View Leaderboard/i })).toHaveAttribute('href', '/dashboard');
  });
});
