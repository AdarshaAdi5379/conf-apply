import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Hero from '../src/components/Hero.jsx';

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    Link: ({ to, children, className }) => (
      <a href={to} className={className} data-testid="link">{children}</a>
    ),
  };
});

const renderHero = () =>
  render(
    <BrowserRouter>
      <Hero />
    </BrowserRouter>
  );

describe('Hero Component', () => {
  it('should render the main heading', () => {
    renderHero();
    expect(screen.getByText(/Recruiter Trust Platform/i)).toBeInTheDocument();
  });

  it('should render the description text', () => {
    renderHero();
    expect(screen.getByText(/Verify recruiters before you apply/i)).toBeInTheDocument();
  });

  it('should render both CTA buttons', () => {
    renderHero();
    expect(screen.getByText('Verify a Recruiter')).toBeInTheDocument();
    expect(screen.getByText('Browse Jobs')).toBeInTheDocument();
  });

  it('should have correct link destinations', () => {
    renderHero();
    const links = screen.getAllByTestId('link');
    const hrefs = links.map(link => link.getAttribute('href'));
    expect(hrefs).toContain('/verify');
    expect(hrefs).toContain('/jobs');
  });
});
