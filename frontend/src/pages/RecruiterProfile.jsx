import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { recruiterAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Building, Mail, Linkedin, Globe, Star, TrendingUp, Eye } from 'lucide-react';
import { getTrustLevel, formatDate, getStarArray } from '../utils/helpers';
import FeedbackForm from '../components/FeedbackForm';

const RecruiterProfile = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRecruiterProfile();
  }, [id]);

  const fetchRecruiterProfile = async () => {
    try {
      const response = await recruiterAPI.getById(id);
      setData(response.data.data);
    } catch (err) {
      setError('Failed to load recruiter profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="card text-center">
          <p className="text-red-600">{error || 'Recruiter not found'}</p>
        </div>
      </div>
    );
  }

  const { recruiter, feedbacks, insights, trustLevel } = data;
  const trustLevelData = getTrustLevel(recruiter.trustScore);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="card mb-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-4">
              <h1 className="text-3xl font-bold text-gray-900">{recruiter.name}</h1>
              {recruiter.isVerified && (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                  ✓ Verified
                </span>
              )}
              {recruiter.isFlagged && (
                <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-full">
                  ⚠ Flagged
                </span>
              )}
            </div>

            <div className="space-y-2 text-gray-600">
              <div className="flex items-center space-x-2">
                <Building className="h-5 w-5" />
                <span>{recruiter.company}</span>
              </div>
              {recruiter.position && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm">{recruiter.position}</span>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Mail className="h-5 w-5" />
                <span>{recruiter.email}</span>
              </div>
              {recruiter.linkedInUrl && (
                <div className="flex items-center space-x-2">
                  <Linkedin className="h-5 w-5" />
                  <a href={recruiter.linkedInUrl} target="_blank" rel="noopener noreferrer" 
                     className="text-primary-600 hover:underline">
                    LinkedIn Profile
                  </a>
                </div>
              )}
              {recruiter.companyWebsite && (
                <div className="flex items-center space-x-2">
                  <Globe className="h-5 w-5" />
                  <a href={recruiter.companyWebsite} target="_blank" rel="noopener noreferrer"
                     className="text-primary-600 hover:underline">
                    Company Website
                  </a>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 mt-4 text-sm text-gray-500">
              <Eye className="h-4 w-4" />
              <span>{recruiter.metadata.profileViews} profile views</span>
            </div>
          </div>

          <div className="mt-6 lg:mt-0 lg:ml-8 text-center">
            <div className="inline-block p-6 bg-gradient-to-br from-primary-50 to-blue-50 rounded-xl">
              <p className="text-sm text-gray-600 mb-2">Trust Score</p>
              <p className={`text-5xl font-bold ${
                recruiter.trustScore >= 70 ? 'text-green-600' :
                recruiter.trustScore >= 40 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {recruiter.trustScore}
              </p>
              <div className={`mt-3 px-4 py-2 rounded-full ${trustLevelData.bgColor} ${trustLevelData.textColor}`}>
                {trustLevelData.label}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-3 gap-4">
            <div className="card text-center">
              <TrendingUp className="h-8 w-8 text-primary-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{recruiter.domainScore}</p>
              <p className="text-sm text-gray-600">Domain Score</p>
            </div>
            <div className="card text-center">
              <Star className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">
                {recruiter.averageRating > 0 ? recruiter.averageRating.toFixed(1) : 'N/A'}
              </p>
              <p className="text-sm text-gray-600">Avg Rating</p>
            </div>
            <div className="card text-center">
              <Star className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{recruiter.feedbackCount}</p>
              <p className="text-sm text-gray-600">Reviews</p>
            </div>
          </div>

          {insights && insights.length > 0 && (
            <div className="card">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Insights</h3>
              <ul className="space-y-2">
                {insights.map((insight, idx) => (
                  <li key={idx} className="text-gray-700 flex items-start space-x-2">
                    <span className="text-primary-600 mt-1">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="card">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Candidate Reviews</h3>
            {feedbacks.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No reviews yet</p>
            ) : (
              <div className="space-y-6">
                {feedbacks.map((feedback) => (
                  <div key={feedback._id} className="border-b border-gray-200 pb-6 last:border-0">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium text-gray-900">{feedback.candidateId?.name || 'Anonymous'}</p>
                        <p className="text-sm text-gray-500">{formatDate(feedback.createdAt)}</p>
                      </div>
                      <div className="flex items-center space-x-1">
                        {getStarArray(feedback.rating).map((filled, idx) => (
                          <Star
                            key={idx}
                            className={`h-4 w-4 ${filled ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-700 mb-3">{feedback.comment}</p>
                    {feedback.tags && feedback.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {feedback.tags.map((tag, idx) => (
                          <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {feedback.recruiterResponse && (
                      <div className="mt-4 pl-4 border-l-2 border-primary-200 bg-primary-50 p-3 rounded-r">
                        <p className="text-sm font-medium text-primary-900 mb-1">Recruiter Response:</p>
                        <p className="text-sm text-gray-700">{feedback.recruiterResponse}</p>
                        <p className="text-xs text-gray-500 mt-2">{formatDate(feedback.respondedAt)}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {isAuthenticated && user?.role === 'candidate' && (
            <FeedbackForm recruiterId={id} onSuccess={fetchRecruiterProfile} />
          )}

          {recruiter.verificationData && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Status</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Email Verified</span>
                  <span className={recruiter.verificationData.hunterVerified ? 'text-green-600' : 'text-red-600'}>
                    {recruiter.verificationData.hunterVerified ? '✓' : '✗'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Domain Verified</span>
                  <span className={recruiter.verificationData.clearbitVerified ? 'text-green-600' : 'text-red-600'}>
                    {recruiter.verificationData.clearbitVerified ? '✓' : '✗'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Safe Browsing</span>
                  <span className={recruiter.verificationData.safeBrowsingPassed ? 'text-green-600' : 'text-red-600'}>
                    {recruiter.verificationData.safeBrowsingPassed ? '✓' : '✗'}
                  </span>
                </div>
                {recruiter.verificationData.lastVerified && (
                  <p className="text-xs text-gray-500 mt-3 pt-3 border-t">
                    Last verified: {formatDate(recruiter.verificationData.lastVerified)}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecruiterProfile;