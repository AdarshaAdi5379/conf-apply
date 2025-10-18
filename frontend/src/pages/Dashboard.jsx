import { useAuth } from '../context/AuthContext';
import RecruiterVerificationForm from '../components/RecruiterVerificationForm';
import Leaderboard from '../components/Leaderboard';
import { Search, TrendingUp, MessageSquare } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600 mt-2">
          {user?.role === 'candidate' && 'Verify recruiters and make informed career decisions'}
          {user?.role === 'recruiter' && 'Build your trusted recruiter profile'}
          {user?.role === 'admin' && 'Manage the platform and monitor activity'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card bg-gradient-to-br from-blue-50 to-primary-50">
          <div className="flex items-center space-x-3">
            <Search className="h-10 w-10 text-primary-600" />
            <div>
              <p className="text-sm text-gray-600">Quick Actions</p>
              <p className="text-lg font-semibold text-gray-900">Verify Recruiter</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-emerald-50">
          <div className="flex items-center space-x-3">
            <TrendingUp className="h-10 w-10 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Top Recruiters</p>
              <p className="text-lg font-semibold text-gray-900">View Leaderboard</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-pink-50">
          <div className="flex items-center space-x-3">
            <MessageSquare className="h-10 w-10 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Community</p>
              <p className="text-lg font-semibold text-gray-900">Share Feedback</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {user?.role === 'candidate' && (
          <>
            <RecruiterVerificationForm />
            <Leaderboard />
          </>
        )}

        {user?.role === 'recruiter' && (
          <div className="lg:col-span-2">
            <div className="card">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Recruiter Profile</h2>
              <p className="text-gray-600 mb-6">
                Build trust with candidates by maintaining a verified profile and responding to feedback.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  💡 Tip: Respond to candidate feedback promptly to improve your trust score!
                </p>
              </div>
            </div>
            <div className="mt-8">
              <Leaderboard />
            </div>
          </div>
        )}

        {user?.role === 'admin' && (
          <div className="lg:col-span-2">
            <div className="card">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Admin Overview</h2>
              <p className="text-gray-600">
                Access the full admin dashboard to manage flagged recruiters, reported feedback, and platform analytics.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;