import { useState, useEffect } from 'react';
import { recruiterAPI } from '../services/api';
import { Trophy, Star, TrendingUp } from 'lucide-react';
import { getTrustLevel } from '../utils/helpers';
import { useNavigate } from 'react-router-dom';

const Leaderboard = () => {
  const [recruiters, setRecruiters] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await recruiterAPI.getLeaderboard(10);
      setRecruiters(response.data.data);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center space-x-3 mb-6">
        <Trophy className="h-7 w-7 text-yellow-500" />
        <h2 className="text-2xl font-bold text-gray-900">Top Verified Recruiters</h2>
      </div>

      {recruiters.length === 0 ? (
        <p className="text-gray-600 text-center py-8">No verified recruiters yet</p>
      ) : (
        <div className="space-y-3">
          {recruiters.map((recruiter, index) => {
            const trustLevel = getTrustLevel(recruiter.trustScore);
            return (
              <div
                key={recruiter.id}
                onClick={() => navigate(`/recruiter/${recruiter.id}`)}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer border border-gray-200"
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                    index === 0 ? 'bg-yellow-100 text-yellow-700' :
                    index === 1 ? 'bg-gray-200 text-gray-700' :
                    index === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {index + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{recruiter.name}</h3>
                    <p className="text-sm text-gray-600 truncate">{recruiter.company}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {recruiter.feedbackCount > 0 && (
                    <div className="flex items-center space-x-1 text-sm">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-medium">{recruiter.averageRating.toFixed(1)}</span>
                      <span className="text-gray-500">({recruiter.feedbackCount})</span>
                    </div>
                  )}

                  <div className={`px-3 py-1 rounded-full ${trustLevel.bgColor} ${trustLevel.textColor} flex items-center space-x-1`}>
                    <TrendingUp className="h-4 w-4" />
                    <span className="font-semibold">{recruiter.trustScore}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;