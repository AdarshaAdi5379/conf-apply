import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { Users, Shield, MessageSquare, AlertTriangle, TrendingUp } from 'lucide-react';
import { formatRelativeTime } from '../utils/helpers';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [flaggedRecruiters, setFlaggedRecruiters] = useState([]);
  const [reportedFeedback, setReportedFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [dashboardRes, flaggedRes, reportedRes] = await Promise.all([
        adminAPI.getDashboard(),
        adminAPI.getFlaggedRecruiters(),
        adminAPI.getReportedFeedback()
      ]);

      setStats(dashboardRes.data.data.stats);
      setFlaggedRecruiters(flaggedRes.data.data);
      setReportedFeedback(reportedRes.data.data);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnflagRecruiter = async (recruiterId) => {
    try {
      await adminAPI.flagRecruiter(recruiterId, { isFlagged: false, reasons: [] });
      fetchData();
    } catch (error) {
      console.error('Failed to unflag recruiter:', error);
    }
  };

  const handleDeleteFeedback = async (feedbackId) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) return;
    
    try {
      await adminAPI.deleteFeedback(feedbackId);
      fetchData();
    } catch (error) {
      console.error('Failed to delete feedback:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="card">
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Recruiters</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalRecruiters}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center space-x-3">
              <MessageSquare className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Feedbacks</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalFeedbacks}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Flagged</p>
                <p className="text-2xl font-bold text-gray-900">{stats.flaggedRecruiters}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center space-x-3">
              <TrendingUp className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Avg Trust Score</p>
                <p className="text-2xl font-bold text-gray-900">{stats.avgTrustScore}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'overview'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('flagged')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'flagged'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Flagged Recruiters ({flaggedRecruiters.length})
          </button>
          <button
            onClick={() => setActiveTab('reported')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'reported'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Reported Feedback ({reportedFeedback.length})
          </button>
        </nav>
      </div>

      {activeTab === 'overview' && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Overview</h3>
          <p className="text-gray-600">
            The platform is running smoothly. Monitor flagged recruiters and reported feedback in their respective tabs.
          </p>
        </div>
      )}

      {activeTab === 'flagged' && (
        <div className="space-y-4">
          {flaggedRecruiters.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-gray-600">No flagged recruiters</p>
            </div>
          ) : (
            flaggedRecruiters.map((recruiter) => (
              <div key={recruiter._id} className="card">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{recruiter.name}</h4>
                    <p className="text-sm text-gray-600">{recruiter.email} • {recruiter.company}</p>
                    <div className="mt-2">
                      <span className="text-sm font-medium text-red-600">Trust Score: {recruiter.trustScore}</span>
                    </div>
                    {recruiter.flaggedReasons.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">Reasons:</p>
                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                          {recruiter.flaggedReasons.map((reason, idx) => (
                            <li key={idx}>{reason}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleUnflagRecruiter(recruiter._id)}
                    className="btn-secondary text-sm"
                  >
                    Unflag
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'reported' && (
        <div className="space-y-4">
          {reportedFeedback.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-gray-600">No reported feedback</p>
            </div>
          ) : (
            reportedFeedback.map((feedback) => (
              <div key={feedback._id} className="card">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        {feedback.candidateId?.name || 'Unknown'}
                      </span>
                      <span className="text-gray-400">→</span>
                      <span className="text-sm text-gray-600">
                        {feedback.recruiterId?.name} ({feedback.recruiterId?.company})
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{feedback.comment}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Rating: {feedback.rating}/5</span>
                      <span>Reason: {feedback.reportReason?.replace('_', ' ')}</span>
                      <span>{formatRelativeTime(feedback.createdAt)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteFeedback(feedback._id)}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;