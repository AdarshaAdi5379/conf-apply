import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Hero from '../components/Hero';
import { Search, Briefcase, MessageSquare, TrendingUp } from 'lucide-react';

const Home = () => {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user?.name}!</h1>
        <p className="text-gray-600 mb-8">What would you like to do today?</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {user?.role === 'candidate' && (
            <>
              <Link to="/jobs" className="card hover:shadow-md transition-shadow text-center p-8">
                <Briefcase className="h-12 w-12 text-primary-600 mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">Browse Jobs</h3>
                <p className="text-gray-600 text-sm">Find verified job listings from trusted recruiters</p>
              </Link>
              <Link to="/my-applications" className="card hover:shadow-md transition-shadow text-center p-8">
                <MessageSquare className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">My Applications</h3>
                <p className="text-gray-600 text-sm">Track your job applications and their status</p>
              </Link>
            </>
          )}
          {user?.role === 'recruiter' && (
            <Link to="/recruiter/jobs" className="card hover:shadow-md transition-shadow text-center p-8">
              <Briefcase className="h-12 w-12 text-primary-600 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Manage Jobs</h3>
              <p className="text-gray-600 text-sm">Post and manage your job listings</p>
            </Link>
          )}
          <Link to="/dashboard" className="card hover:shadow-md transition-shadow text-center p-8">
            <TrendingUp className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Dashboard</h3>
            <p className="text-gray-600 text-sm">Verify recruiters and view leaderboards</p>
          </Link>
          <Link to="/profile" className="card hover:shadow-md transition-shadow text-center p-8">
            <Search className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">My Profile</h3>
            <p className="text-gray-600 text-sm">Manage your profile and uploaded resume</p>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Hero />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="card">
            <h3 className="text-xl font-semibold mb-2">How it works</h3>
            <p className="text-gray-600">Verify recruiters using multi-source signals and community feedback.</p>
          </div>
          <div className="card">
            <h3 className="text-xl font-semibold mb-2">Community</h3>
            <p className="text-gray-600">Report suspicious recruiters and help others hire safely.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;