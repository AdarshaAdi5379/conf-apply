import React, { useEffect, useState } from 'react';
import { recruiterAPI, feedbackAPI } from '../services/api';
import { useParams } from 'react-router-dom';
import { formatDate, getStarArray } from '../utils/helpers';

const RecruiterProfile = () => {
  const { id } = useParams();
  const [recruiter, setRecruiter] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);

  useEffect(()=>{ const load = async()=>{ try{ const res = await recruiterAPI.getById(id); setRecruiter(res.data.data.recruiter); setFeedbacks(res.data.data.feedbacks || []); }catch(e){ console.error(e); } }; load(); },[id]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {recruiter ? (
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-semibold">{recruiter.name}</h2>
            <p className="text-gray-600">{recruiter.company} • {recruiter.position}</p>
            <div className="mt-3">Trust Score: <strong>{recruiter.trustScore}</strong></div>
          </div>
          <div className="card">
            <h3 className="font-semibold mb-3">Recent Feedback</h3>
            {feedbacks.length === 0 ? <p>No feedback yet</p> : feedbacks.map(f=> (
              <div key={f._id} className="border-b last:border-b-0 py-3">
                <div className="flex justify-between">
                  <div><strong>{f.candidateId?.name || 'Anonymous'}</strong></div>
                  <div className="text-sm text-gray-500">{formatDate(f.createdAt)}</div>
                </div>
                <p className="mt-1">{f.comment}</p>
              </div>
            ))}
          </div>
        </div>
      ) : <div>Loading...</div>}
    </div>
  );
};

export default RecruiterProfile;